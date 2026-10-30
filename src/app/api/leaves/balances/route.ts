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

    const { searchParams } = new URL(req.url);
    const queryTeacherId = searchParams.get('teacherId');

    const isAdmin =
      user.isSuperAdmin ||
      user.roles.includes('SCHOOL_OWNER') ||
      user.roles.includes('PRINCIPAL') ||
      user.roles.includes('ADMIN');

    // Ensure all leave types exist in balance table for all teachers in school
    const leaveTypes = await prisma.leaveType.findMany({
      where: { schoolId: user.schoolId, isActive: true },
    });

    const teachersInSchool = await prisma.teacher.findMany({
      where: { schoolId: user.schoolId },
    });

    for (const t of teachersInSchool) {
      for (const lt of leaveTypes) {
        await prisma.teacherLeaveBalance.upsert({
          where: { teacherId_leaveTypeId: { teacherId: t.id, leaveTypeId: lt.id } },
          update: {},
          create: {
            schoolId: user.schoolId,
            teacherId: t.id,
            leaveTypeId: lt.id,
            allocatedDays: lt.defaultDays,
            usedDays: 0,
          },
        });
      }
    }

    let balancesWhere: any = {};
    if (isAdmin && queryTeacherId === 'ALL') {
      balancesWhere = { schoolId: user.schoolId };
    } else {
      let teacherId = queryTeacherId;
      if (!isAdmin || !teacherId) {
        const teacher = await prisma.teacher.findFirst({
          where: { userId: user.id },
        });
        teacherId = teacher?.id || '';
      }
      if (!teacherId) {
        return NextResponse.json({ success: true, data: [] });
      }
      balancesWhere = { teacherId };
    }

    const balances = await prisma.teacherLeaveBalance.findMany({
      where: balancesWhere,
      include: {
        leaveType: true,
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: [{ teacherId: 'asc' }, { leaveType: { name: 'asc' } }],
    });

    const formatted = balances.map((b) => ({
      id: b.id,
      teacherId: b.teacherId,
      teacherName: `${b.teacher.user.firstName} ${b.teacher.user.lastName}`,
      leaveTypeId: b.leaveTypeId,
      leaveTypeName: b.leaveType.name,
      leaveTypeCode: b.leaveType.code,
      allocatedDays: b.allocatedDays,
      usedDays: b.usedDays,
      remainingDays: Math.max(0, b.allocatedDays - b.usedDays),
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

    const isAdmin =
      user.isSuperAdmin ||
      user.roles.includes('SCHOOL_OWNER') ||
      user.roles.includes('PRINCIPAL') ||
      user.roles.includes('ADMIN');

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: { message: 'Only administrators can assign leave quotas' } }, { status: 403 });
    }

    const { teacherId, leaveTypeId, allocatedDays } = await req.json();

    if (!teacherId || !leaveTypeId || allocatedDays === undefined) {
      return NextResponse.json({ success: false, error: { message: 'teacherId, leaveTypeId, and allocatedDays required' } }, { status: 400 });
    }

    const balance = await prisma.teacherLeaveBalance.upsert({
      where: { teacherId_leaveTypeId: { teacherId, leaveTypeId } },
      update: { allocatedDays: Number(allocatedDays) },
      create: {
        schoolId: user.schoolId,
        teacherId,
        leaveTypeId,
        allocatedDays: Number(allocatedDays),
        usedDays: 0,
      },
      include: { leaveType: true, teacher: { include: { user: true } } },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'LEAVE_QUOTA_ASSIGNED',
      resource: `Faculty ${balance.teacher.user.firstName} ${balance.teacher.user.lastName}`,
      newValue: { leaveType: balance.leaveType.name, allocatedDays: Number(allocatedDays) },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...balance,
        remainingDays: Math.max(0, balance.allocatedDays - balance.usedDays),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
