import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, signToken, setAuthCookie } from '@/lib/auth';
import { logAuditTrail } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        school: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: { message: 'Your account is deactivated or suspended' } },
        { status: 403 }
      );
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const userRoles = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true },
    });
    const roles = userRoles.map((ur) => ur.role.code);

    const token = signToken({
      userId: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
      schoolId: user.schoolId,
      roles,
    });

    let redirectUrl = '/admin';
    if (user.isSuperAdmin) {
      redirectUrl = '/super-admin';
    } else if (roles.includes('STUDENT') || roles.includes('PARENT')) {
      redirectUrl = '/student';
    } else if (
      roles.includes('SUBJECT_TEACHER') ||
      roles.includes('JUNIOR_MATH_TEACHER') ||
      roles.includes('TEACHER') ||
      roles.includes('HOD') ||
      roles.includes('FACULTY')
    ) {
      redirectUrl = '/faculty';
    }

    const res = NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isSuperAdmin: user.isSuperAdmin,
        schoolId: user.schoolId,
        schoolName: user.school?.name,
        roles,
        redirectUrl,
        token,
      },
    });

    setAuthCookie(res, token);

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'USER_LOGIN',
      resource: `User ${user.email}`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return res;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'An internal error occurred during login' } },
      { status: 500 }
    );
  }
}
