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

    if (!hasPermission(user, 'teachers', 'VIEW')) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied: teachers.VIEW' } }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get('departmentId');

    const where: any = { schoolId: user.schoolId };
    if (departmentId && departmentId !== 'ALL') {
      where.departmentId = departmentId;
    }

    const teachers = await prisma.teacher.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            avatarUrl: true,
            userRoles: { include: { role: { select: { id: true, name: true, code: true } } } },
          },
        },
        department: { select: { id: true, name: true, code: true } },
        classTeacherOf: { select: { id: true, name: true } },
        classSubjects: {
          include: {
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { employeeCode: 'asc' },
    });

    const formatted = teachers.map((t) => ({
      id: t.id,
      userId: t.userId,
      employeeCode: t.employeeCode,
      firstName: t.user.firstName,
      lastName: t.user.lastName,
      email: t.user.email,
      phone: t.phone || t.user.phone || '',
      designation: t.designation,
      qualification: t.qualification || '',
      departmentName: t.department?.name || 'General',
      departmentId: t.department?.id || '',
      roleId: t.user.userRoles[0]?.role?.id || '',
      roles: t.user.userRoles.map((ur) => ur.role.name),
      classTeacherOf: t.classTeacherOf.map((s) => s.name).join(', ') || 'None',
      subjectsTaught: t.classSubjects.map((cs) => `${cs.subject?.name || 'Subject'} (${cs.class?.name || 'Class'})`).join(', ') || 'None',
      joiningDate: t.joiningDate,
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

    if (!hasPermission(user, 'teachers', 'CREATE')) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied: teachers.CREATE' } }, { status: 403 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      employeeCode,
      designation,
      departmentId,
      qualification,
      roleId,
      phone,
    } = body;

    if (!firstName || !lastName || !email || !employeeCode) {
      return NextResponse.json(
        { success: false, error: { message: 'First name, last name, email, and employee code are required' } },
        { status: 400 }
      );
    }

    const cleanCode = employeeCode.toUpperCase().trim();

    // Check unique email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingUser) {
      return NextResponse.json({ success: false, error: { message: `Email ${email} is already in use` } }, { status: 409 });
    }

    // Check unique employeeCode
    const existingTeacher = await prisma.teacher.findUnique({
      where: { schoolId_employeeCode: { schoolId: user.schoolId, employeeCode: cleanCode } },
    });
    if (existingTeacher) {
      return NextResponse.json({ success: false, error: { message: `Employee code ${cleanCode} already exists` } }, { status: 409 });
    }

    const passwordHash = await hashPassword(password || 'teacher123');

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName,
        lastName,
        phone: phone || null,
        schoolId: user.schoolId,
        status: 'ACTIVE',
      },
    });

    // Assign Role
    if (roleId) {
      await prisma.userRole.create({
        data: { userId: newUser.id, roleId },
      });
    } else {
      const defaultRole = await prisma.role.findFirst({
        where: { schoolId: user.schoolId, code: 'SUBJECT_TEACHER' },
      });
      if (defaultRole) {
        await prisma.userRole.create({
          data: { userId: newUser.id, roleId: defaultRole.id },
        });
      }
    }

    const teacher = await prisma.teacher.create({
      data: {
        userId: newUser.id,
        schoolId: user.schoolId,
        employeeCode: cleanCode,
        designation: designation || 'Faculty',
        departmentId: departmentId || null,
        qualification: qualification || null,
        phone: phone || null,
      },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'TEACHER_ONBOARDED',
      resource: `Faculty ${firstName} ${lastName} (${cleanCode})`,
    });

    return NextResponse.json({ success: true, data: teacher });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    if (!hasPermission(user, 'teachers', 'EDIT') && !hasPermission(user, 'teachers', 'UPDATE')) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied: teachers.EDIT' } }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      firstName,
      lastName,
      email,
      employeeCode,
      designation,
      departmentId,
      qualification,
      roleId,
      phone,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: { message: 'Teacher ID is required' } }, { status: 400 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { id, schoolId: user.schoolId },
      include: { user: true },
    });

    if (!teacher) {
      return NextResponse.json({ success: false, error: { message: 'Teacher record not found' } }, { status: 404 });
    }

    // Update user details
    const userUpdate: any = {};
    if (firstName) userUpdate.firstName = firstName.trim();
    if (lastName) userUpdate.lastName = lastName.trim();
    if (phone !== undefined) userUpdate.phone = phone ? phone.trim() : null;

    if (email && email.toLowerCase().trim() !== teacher.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (existingUser && existingUser.id !== teacher.userId) {
        return NextResponse.json({ success: false, error: { message: `Email ${email} is already in use by another user` } }, { status: 409 });
      }
      userUpdate.email = email.toLowerCase().trim();
    }

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: teacher.userId },
        data: userUpdate,
      });
    }

    // Update teacher details
    const teacherUpdate: any = {};
    if (designation !== undefined) teacherUpdate.designation = designation.trim();
    if (departmentId !== undefined) teacherUpdate.departmentId = departmentId || null;
    if (qualification !== undefined) teacherUpdate.qualification = qualification ? qualification.trim() : null;
    if (phone !== undefined) teacherUpdate.phone = phone ? phone.trim() : null;

    if (employeeCode) {
      const cleanCode = employeeCode.toUpperCase().trim();
      if (cleanCode !== teacher.employeeCode) {
        const existingTeacher = await prisma.teacher.findUnique({
          where: { schoolId_employeeCode: { schoolId: user.schoolId, employeeCode: cleanCode } },
        });
        if (existingTeacher && existingTeacher.id !== teacher.id) {
          return NextResponse.json({ success: false, error: { message: `Employee code ${cleanCode} already exists` } }, { status: 409 });
        }
        teacherUpdate.employeeCode = cleanCode;
      }
    }

    if (Object.keys(teacherUpdate).length > 0) {
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: teacherUpdate,
      });
    }

    // Update role assignment if provided
    if (roleId) {
      await prisma.userRole.deleteMany({
        where: { userId: teacher.userId },
      });
      await prisma.userRole.create({
        data: { userId: teacher.userId, roleId },
      });
    }

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'TEACHER_UPDATED',
      resource: `Faculty ${firstName || teacher.user.firstName} ${lastName || teacher.user.lastName} (${teacherUpdate.employeeCode || teacher.employeeCode})`,
    });

    return NextResponse.json({ success: true, message: 'Faculty updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
