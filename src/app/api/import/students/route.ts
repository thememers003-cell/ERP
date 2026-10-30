import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { logAuditTrail } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await req.json();
    const rows = body.rows || body.students;
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: { message: 'No rows provided' } }, { status: 400 });
    }

    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      include: {
        classes: { include: { sections: true } },
      },
    });

    if (!school || !school.currentYearId) {
      return NextResponse.json({ success: false, error: { message: 'Active academic year not found' } }, { status: 400 });
    }

    const defaultStudentRole = await prisma.role.findFirst({
      where: { schoolId: user.schoolId, code: 'STUDENT' },
    });
    const defaultParentRole = await prisma.role.findFirst({
      where: { schoolId: user.schoolId, code: 'PARENT' },
    });

    const defaultPassword = await hashPassword('student123');
    const defaultParentPassword = await hashPassword('parent123');
    let imported = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Normalize column lookups
      const firstName =
        row['First Name'] || row.firstName || row.First_Name || row['Student Name']?.split(' ')[0] || row.name?.split(' ')[0];
      const lastName =
        row['Last Name'] ||
        row.lastName ||
        row.Last_Name ||
        (row['Student Name'] ? row['Student Name'].split(' ').slice(1).join(' ') : '') ||
        (row.name ? row.name.split(' ').slice(1).join(' ') : '') ||
        'Student';

      if (!firstName) {
        errors.push(`Row ${i + 1}: Missing student first name`);
        continue;
      }

      const rawEmail = row['Email'] || row.email || row['Student Email'];
      const admNo = String(
        row['Admission Number'] ||
        row['Admission #'] ||
        row.admissionNumber ||
        row.admNo ||
        `ADM-${Date.now().toString().slice(-6)}-${i + 1}`
      ).trim();

      const email = (rawEmail || `stu.${admNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.edu`).toLowerCase().trim();
      const roll = String(row['Roll Number'] || row['Roll #'] || row.rollNumber || (i + 1)).trim();
      const rawGender = String(row['Gender'] || row.gender || 'OTHER').toUpperCase().trim();
      const gender = ['MALE', 'FEMALE'].includes(rawGender) ? rawGender : 'OTHER';
      const bloodGroup = String(row['Blood Group'] || row.bloodGroup || 'O+').trim();
      const parentName = row['Parent Name'] || row.parentName || row['Guardian Name'];
      const parentPhone = row['Parent Phone'] || row.parentPhone || row['Guardian Phone'];

      // Match Class
      const rawClass = String(row['Class'] || row.className || row['Grade'] || '').trim().toLowerCase();
      let matchedClass = school.classes.find(
        (c) =>
          c.name.toLowerCase() === rawClass ||
          c.code.toLowerCase() === rawClass ||
          c.name.toLowerCase().includes(rawClass) ||
          rawClass.includes(c.name.toLowerCase())
      );
      if (!matchedClass && school.classes.length > 0) {
        matchedClass = school.classes[0];
      }

      if (!matchedClass || matchedClass.sections.length === 0) {
        errors.push(`Row ${i + 1}: No valid class or sections found for "${rawClass || 'Default'}"`);
        continue;
      }

      // Match Section
      const rawSection = String(row['Section'] || row.sectionName || row.section || '').trim().toLowerCase();
      let matchedSection = matchedClass.sections.find(
        (s) =>
          s.name.toLowerCase() === rawSection ||
          s.name.toLowerCase().endsWith(rawSection) ||
          rawSection.endsWith(s.name.toLowerCase())
      );
      if (!matchedSection) {
        matchedSection = matchedClass.sections[0];
      }

      try {
        // Upsert student user
        const u = await prisma.user.upsert({
          where: { email },
          update: { firstName, lastName },
          create: {
            email,
            passwordHash: defaultPassword,
            firstName,
            lastName,
            schoolId: user.schoolId,
            status: 'ACTIVE',
          },
        });

        if (defaultStudentRole) {
          await prisma.userRole.upsert({
            where: { userId_roleId: { userId: u.id, roleId: defaultStudentRole.id } },
            update: {},
            create: { userId: u.id, roleId: defaultStudentRole.id },
          });
        }

        // Upsert student record
        const existingStudent = await prisma.student.findFirst({
          where: {
            OR: [
              { userId: u.id },
              { schoolId: user.schoolId, admissionNumber: admNo },
            ],
          },
        });

        let studentRecordId = '';
        if (existingStudent) {
          const updatedStudent = await prisma.student.update({
            where: { id: existingStudent.id },
            data: {
              admissionNumber: admNo,
              rollNumber: roll,
              classId: matchedClass.id,
              sectionId: matchedSection.id,
              gender,
              bloodGroup,
            },
          });
          studentRecordId = updatedStudent.id;
          updated++;
        } else {
          const newStudent = await prisma.student.create({
            data: {
              userId: u.id,
              schoolId: user.schoolId,
              admissionNumber: admNo,
              rollNumber: roll,
              classId: matchedClass.id,
              sectionId: matchedSection.id,
              academicYearId: school.currentYearId,
              gender,
              bloodGroup,
              status: 'ACTIVE',
            },
          });
          studentRecordId = newStudent.id;
          imported++;
        }

        // Parent linking if parent info provided
        if (parentName && studentRecordId) {
          const pFirst = parentName.split(' ')[0];
          const pLast = parentName.split(' ').slice(1).join(' ') || 'Parent';
          const pEmail = `parent.${admNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.edu`;

          const pUser = await prisma.user.upsert({
            where: { email: pEmail },
            update: { firstName: pFirst, lastName: pLast, phone: parentPhone ? String(parentPhone) : null },
            create: {
              email: pEmail,
              passwordHash: defaultParentPassword,
              firstName: pFirst,
              lastName: pLast,
              phone: parentPhone ? String(parentPhone) : null,
              schoolId: user.schoolId,
              status: 'ACTIVE',
            },
          });

          if (defaultParentRole) {
            await prisma.userRole.upsert({
              where: { userId_roleId: { userId: pUser.id, roleId: defaultParentRole.id } },
              update: {},
              create: { userId: pUser.id, roleId: defaultParentRole.id },
            });
          }

          const parentRecord = await prisma.parent.upsert({
            where: { userId: pUser.id },
            update: {},
            create: {
              userId: pUser.id,
              schoolId: user.schoolId,
              relationship: 'GUARDIAN',
            },
          });

          await prisma.parentStudent.upsert({
            where: { parentId_studentId: { parentId: parentRecord.id, studentId: studentRecordId } },
            update: {},
            create: {
              parentId: parentRecord.id,
              studentId: studentRecordId,
              isPrimaryContact: true,
            },
          });
        }
      } catch (err: any) {
        errors.push(`Row ${i + 1} (${firstName} ${lastName}): ${err.message}`);
      }
    }

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'EXCEL_IMPORT_STUDENTS',
      resource: `Imported ${imported} new students, updated ${updated}`,
      newValue: { imported, updated, totalRows: rows.length, errorsCount: errors.length },
    });

    return NextResponse.json({
      success: true,
      data: {
        imported,
        updated,
        total: rows.length,
        errors,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
