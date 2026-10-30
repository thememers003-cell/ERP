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

    const isAuthorized =
      user.isSuperAdmin ||
      user.roles.includes('SCHOOL_OWNER') ||
      user.roles.includes('ADMIN');

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: { message: 'Permission denied: Only Administrators can bulk-assign credentials' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      classId,
      sectionId,
      domain = 'school.edu',
      emailPattern = 'name', // 'name' | 'admission' | 'roll_class'
      passwordMode = 'default', // 'default' | 'admission'
      defaultPassword = 'Student@123',
    } = body;

    const cleanDomain = String(domain || 'school.edu')
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '')
      .replace(/^@/, '');

    const where: any = {
      schoolId: user.schoolId,
      status: 'ACTIVE',
    };
    if (classId && classId !== 'ALL') where.classId = classId;
    if (sectionId && sectionId !== 'ALL') where.sectionId = sectionId;

    const students = await prisma.student.findMany({
      where,
      include: {
        user: true,
        class: true,
        section: true,
      },
      orderBy: [
        { class: { numericLevel: 'asc' } },
        { section: { name: 'asc' } },
        { user: { firstName: 'asc' } },
        { user: { lastName: 'asc' } },
      ],
    });

    if (students.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'No active students found matching the selected criteria' } },
        { status: 404 }
      );
    }

    const results: Array<{
      id: string;
      name: string;
      admissionNumber: string;
      rollNumber: string;
      className: string;
      sectionName: string;
      email: string;
      temporaryPassword: string;
    }> = [];

    for (const student of students) {
      let emailPrefix = '';
      if (emailPattern === 'admission') {
        emailPrefix = `stu.${student.admissionNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      } else if (emailPattern === 'roll_class') {
        const cCode = student.class.code.toLowerCase().replace(/[^a-z0-9]/g, '') || 'cls';
        const secCode = student.section.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'a';
        const rNo = (student.rollNumber || '01').toLowerCase().replace(/[^a-z0-9]/g, '');
        emailPrefix = `stu.${cCode}.${secCode}.${rNo}`;
      } else {
        // Name pattern: firstname.lastname + numeric suffix from admission number
        const fName = student.user.firstName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student';
        const lName = student.user.lastName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'learner';
        const admDigits = student.admissionNumber.replace(/[^0-9]/g, '').slice(-3) || '01';
        emailPrefix = `${fName}.${lName}${admDigits}`;
      }

      let finalEmail = `${emailPrefix}@${cleanDomain}`;

      // Check if email is already taken by someone else
      const existingUser = await prisma.user.findFirst({
        where: {
          email: finalEmail,
          NOT: { id: student.userId },
        },
      });
      if (existingUser) {
        finalEmail = `${emailPrefix}.${student.id.slice(0, 4)}@${cleanDomain}`;
      }

      // Password generation
      let plainPassword = defaultPassword || 'Student@123';
      if (passwordMode === 'admission') {
        const cleanAdm = student.admissionNumber.replace(/[^a-zA-Z0-9]/g, '') || '1234';
        plainPassword = `Pass@${cleanAdm}`;
      }

      const hashedPassword = await hashPassword(plainPassword);

      // Update student user credentials
      await prisma.user.update({
        where: { id: student.userId },
        data: {
          email: finalEmail,
          passwordHash: hashedPassword,
        },
      });

      results.push({
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber || '-',
        className: student.class.name,
        sectionName: student.section.name,
        email: finalEmail,
        temporaryPassword: plainPassword,
      });
    }

    await logAuditTrail({
      actorId: user.id,
      schoolId: user.schoolId,
      action: 'UPDATE',
      resource: 'USER_CREDENTIALS',
      resourceId: `bulk-${results.length}-students`,
      newValue: {
        count: results.length,
        classId: classId || 'ALL',
        sectionId: sectionId || 'ALL',
        domain: cleanDomain,
        emailPattern,
        passwordMode,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        count: results.length,
        credentials: results,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
