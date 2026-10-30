import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditTrail } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const types = await prisma.leaveType.findMany({
      where: { schoolId: user.schoolId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: types });
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

    const isAdmin =
      user.isSuperAdmin ||
      user.roles.includes('SCHOOL_OWNER') ||
      user.roles.includes('PRINCIPAL') ||
      user.roles.includes('ADMIN');

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: { message: 'Only administrators can create custom leave types' } }, { status: 403 });
    }

    const { name, code, defaultDays, description } = await req.json();

    if (!name || !code) {
      return NextResponse.json({ success: false, error: { message: 'Name and unique code are required' } }, { status: 400 });
    }

    const formattedCode = code.toUpperCase().trim().replace(/\s+/g, '_');
    const days = Number(defaultDays) || 4;

    const leaveType = await prisma.leaveType.upsert({
      where: { schoolId_code: { schoolId: user.schoolId, code: formattedCode } },
      update: { name, defaultDays: days, description, isActive: true },
      create: {
        schoolId: user.schoolId,
        name,
        code: formattedCode,
        defaultDays: days,
        description,
        isActive: true,
      },
    });

    // Auto-initialize balance for all existing teachers in the school
    const teachers = await prisma.teacher.findMany({
      where: { schoolId: user.schoolId },
    });

    for (const t of teachers) {
      await prisma.teacherLeaveBalance.upsert({
        where: { teacherId_leaveTypeId: { teacherId: t.id, leaveTypeId: leaveType.id } },
        update: {},
        create: {
          schoolId: user.schoolId,
          teacherId: t.id,
          leaveTypeId: leaveType.id,
          allocatedDays: days,
          usedDays: 0,
        },
      });
    }

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'LEAVE_TYPE_CREATED',
      resource: `LeaveType ${leaveType.name} (${leaveType.code})`,
      newValue: { defaultDays: days },
    });

    return NextResponse.json({ success: true, data: leaveType });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
