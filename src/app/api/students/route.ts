import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAuditTrail } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    if (!hasPermission(user, 'students', 'VIEW')) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied: students.VIEW' } }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const classId = searchParams.get('classId') || '';
    const sectionId = searchParams.get('sectionId') || '';
    const status = searchParams.get('status') || '';

    const where: any = { schoolId: user.schoolId };

    if (user.roles.includes('STUDENT')) {
      where.userId = user.id;
    } else {
      if (search) {
        where.OR = [
          { admissionNumber: { contains: search } },
          { rollNumber: { contains: search } },
          { user: { firstName: { contains: search } } },
          { user: { lastName: { contains: search } } },
          { user: { email: { contains: search } } },
        ];
      }

      if (classId && classId !== 'ALL') where.classId = classId;
      if (sectionId && sectionId !== 'ALL') where.sectionId = sectionId;
      if (status && status !== 'ALL') where.status = status;
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true, roomNumber: true } },
        parentLinks: {
          include: {
            parent: {
              include: {
                user: { select: { firstName: true, lastName: true, phone: true, email: true } },
              },
            },
          },
        },
        _count: {
          select: {
            attendances: true,
            marks: true,
            invoices: true,
          },
        },
      },
      orderBy: [{ class: { numericLevel: 'asc' } }, { rollNumber: 'asc' }],
    });

    const formatted = students.map((s) => ({
      id: s.id,
      userId: s.userId,
      admissionNumber: s.admissionNumber,
      rollNumber: s.rollNumber || '-',
      firstName: s.user.firstName,
      lastName: s.user.lastName,
      email: s.user.email,
      phone: s.user.phone,
      user: {
        firstName: s.user.firstName,
        lastName: s.user.lastName,
        email: s.user.email,
        phone: s.user.phone,
      },
      gender: s.gender,
      bloodGroup: s.bloodGroup || 'N/A',
      className: s.class?.name || 'Class',
      classId: s.class?.id || '',
      sectionName: s.section?.name || 'Section',
      sectionId: s.section?.id || '',
      status: s.status,
      parentName: s.parentLinks[0]?.parent.user ? `${s.parentLinks[0].parent.user.firstName} ${s.parentLinks[0].parent.user.lastName}` : 'Not linked',
      parentPhone: s.parentLinks[0]?.parent.user?.phone || '-',
      attendanceRecordsCount: s._count.attendances,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    if (!hasPermission(user, 'students', 'CREATE')) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied: students.CREATE' } }, { status: 403 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      admissionNumber,
      rollNumber,
      classId,
      sectionId,
      gender,
      bloodGroup,
      address,
      emergencyPhone,
    } = body;

    if (!firstName || !lastName || !email || !classId || !sectionId) {
      return NextResponse.json(
        { success: false, error: { message: 'First name, last name, email, class, and section are required' } },
        { status: 400 }
      );
    }

    // Check unique email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingUser) {
      return NextResponse.json({ success: false, error: { message: `Email ${email} is already in use` } }, { status: 409 });
    }

    // Generate or verify admission number
    const finalAdmNo =
      admissionNumber?.trim() ||
      `ADM-${Date.now().toString().slice(-6)}`;

    const existingStudent = await prisma.student.findUnique({
      where: { schoolId_admissionNumber: { schoolId: user.schoolId, admissionNumber: finalAdmNo } },
    });
    if (existingStudent) {
      return NextResponse.json({ success: false, error: { message: `Admission number ${finalAdmNo} already exists` } }, { status: 409 });
    }

    // Get current academic year
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: { currentYearId: true },
    });

    if (!school?.currentYearId) {
      return NextResponse.json({ success: false, error: { message: 'No active academic year found' } }, { status: 400 });
    }

    // Find student role
    let studentRole = await prisma.role.findFirst({
      where: { schoolId: user.schoolId, code: 'STUDENT' },
    });

    const passwordHash = await hashPassword(password || 'student123');

    // Create User record
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName,
        lastName,
        schoolId: user.schoolId,
        status: 'ACTIVE',
      },
    });

    if (studentRole) {
      await prisma.userRole.create({
        data: { userId: newUser.id, roleId: studentRole.id },
      });
    }

    // Create Student record
    const student = await prisma.student.create({
      data: {
        userId: newUser.id,
        schoolId: user.schoolId,
        admissionNumber: finalAdmNo,
        rollNumber: rollNumber || null,
        classId,
        sectionId,
        academicYearId: school.currentYearId,
        gender: gender || 'OTHER',
        bloodGroup: bloodGroup || null,
        address: address || null,
        emergencyPhone: emergencyPhone || null,
        status: 'ACTIVE',
      },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'STUDENT_ENROLLED',
      resource: `Student ${firstName} ${lastName} (${finalAdmNo})`,
      newValue: { studentId: student.id, classId, sectionId },
    });

    return NextResponse.json({ success: true, data: student });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
