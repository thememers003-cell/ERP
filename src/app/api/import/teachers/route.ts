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
    const rows = body.rows || body.teachers;
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: { message: 'No rows provided' } }, { status: 400 });
    }

    const departments = await prisma.department.findMany({
      where: { schoolId: user.schoolId },
    });

    const defaultRole = await prisma.role.findFirst({
      where: { schoolId: user.schoolId, code: 'SUBJECT_TEACHER' },
    });

    const defaultPassword = await hashPassword('teacher123');
    let imported = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const firstName = row['First Name'] || row.firstName || row.First_Name || row.name?.split(' ')[0];
      const lastName = row['Last Name'] || row.lastName || row.Last_Name || row.name?.split(' ').slice(1).join(' ') || 'Faculty';
      const email = (row['Email'] || row.email || `fac.${Date.now()}.${i}@school.edu`).toLowerCase().trim();
      const employeeCode = String(row['Employee Code'] || row.employeeCode || `FAC-${Date.now().toString().slice(-4)}-${i}`).toUpperCase().trim();
      const designation = row['Designation'] || row.designation || 'Faculty Instructor';
      const qualification = row['Qualification'] || row.qualification || 'B.Ed. M.Sc.';
      const phone = row['Phone'] || row.phone || null;

      if (!firstName) {
        errors.push(`Row ${i + 1}: Missing name`);
        continue;
      }

      // Match department
      const deptName = row['Department'] || row.departmentName;
      const matchedDept = departments.find((d) => d.name.toLowerCase() === String(deptName).toLowerCase()) || departments[0];

      try {
        const u = await prisma.user.upsert({
          where: { email },
          update: { firstName, lastName, phone },
          create: {
            email,
            passwordHash: defaultPassword,
            firstName,
            lastName,
            phone,
            schoolId: user.schoolId,
            status: 'ACTIVE',
          },
        });

        if (defaultRole) {
          await prisma.userRole.upsert({
            where: { userId_roleId: { userId: u.id, roleId: defaultRole.id } },
            update: {},
            create: { userId: u.id, roleId: defaultRole.id },
          });
        }

        const existingTeacher = await prisma.teacher.findFirst({
          where: {
            OR: [
              { userId: u.id },
              { schoolId: user.schoolId, employeeCode },
            ],
          },
        });

        if (existingTeacher) {
          await prisma.teacher.update({
            where: { id: existingTeacher.id },
            data: {
              employeeCode,
              designation,
              qualification,
              departmentId: matchedDept ? matchedDept.id : null,
              phone,
            },
          });
        } else {
          await prisma.teacher.create({
            data: {
              userId: u.id,
              schoolId: user.schoolId,
              employeeCode,
              designation,
              qualification,
              departmentId: matchedDept ? matchedDept.id : null,
              phone,
            },
          });
        }

        imported++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'EXCEL_IMPORT_TEACHERS',
      resource: `Imported ${imported} faculty records from Excel/CSV`,
    });

    return NextResponse.json({
      success: true,
      data: { imported, total: rows.length, errors },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
