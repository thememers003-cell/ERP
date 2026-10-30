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

    const isAdmin =
      user.isSuperAdmin ||
      user.roles.includes('SCHOOL_OWNER') ||
      user.roles.includes('PRINCIPAL') ||
      user.roles.includes('ADMIN');

    const teacher = await prisma.teacher.findFirst({
      where: { userId: user.id },
    });

    // Students have no staff leaves
    if (user.roles.includes('STUDENT')) {
      return NextResponse.json({ success: true, data: [] });
    }

    const where: any = { schoolId: user.schoolId };

    // If not admin, strictly show ONLY leaves for this employee
    if (!isAdmin) {
      if (!teacher) {
        return NextResponse.json({ success: true, data: [] });
      }
      where.employeeId = teacher.id;
    }

    const leaves = await prisma.leaveApplication.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = leaves.map((l) => ({
      id: l.id,
      employeeName: l.teacher?.user ? `${l.teacher.user.firstName} ${l.teacher.user.lastName}` : 'Staff Member',
      employeeCode: l.teacher?.employeeCode || 'EMP',
      departmentName: l.teacher?.department?.name || 'General',
      leaveType: l.leaveType,
      startDate: l.startDate,
      endDate: l.endDate,
      reason: l.reason,
      status: l.status,
      remarks: l.remarks,
      createdAt: l.createdAt,
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

    if (user.roles.includes('STUDENT')) {
      return NextResponse.json({ success: false, error: { message: 'Students cannot apply for staff leave' } }, { status: 403 });
    }

    let teacher = await prisma.teacher.findFirst({
      where: { userId: user.id },
    });

    if (!teacher) {
      return NextResponse.json({ success: false, error: { message: 'Only registered staff members can apply for leave' } }, { status: 400 });
    }

    const { leaveType, startDate, endDate, reason } = await req.json();

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json({ success: false, error: { message: 'All leave fields are required' } }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Prevent duplicate identical leave applications
    const existingLeave = await prisma.leaveApplication.findFirst({
      where: {
        schoolId: user.schoolId,
        employeeId: teacher.id,
        leaveType,
        startDate: start,
        endDate: end,
      },
    });

    if (existingLeave) {
      return NextResponse.json({
        success: true,
        data: existingLeave,
        message: 'Leave application already exists for these dates',
      });
    }

    const leave = await prisma.leaveApplication.create({
      data: {
        schoolId: user.schoolId,
        employeeId: teacher.id,
        leaveType,
        startDate: start,
        endDate: end,
        reason,
        status: 'PENDING',
      },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'LEAVE_APPLIED',
      resource: `Leave: ${leaveType} (${startDate} to ${endDate})`,
    });

    return NextResponse.json({ success: true, data: leave });
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

    const body = await req.json();
    const leaveId = body.leaveId || body.id;
    const { status, remarks } = body;

    const existingLeave = await prisma.leaveApplication.findUnique({
      where: { id: leaveId },
    });

    if (!existingLeave) {
      return NextResponse.json({ success: false, error: { message: 'Leave application not found' } }, { status: 404 });
    }

    const previousStatus = existingLeave.status;

    const leave = await prisma.leaveApplication.update({
      where: { id: leaveId },
      data: {
        status,
        remarks: remarks || null,
        approvedById: user.id,
      },
    });

    // Calculate duration in days
    const days = Math.max(
      1,
      Math.round((new Date(existingLeave.endDate).getTime() - new Date(existingLeave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    // If approved, deduct days from teacher's customizable balance!
    if (status === 'APPROVED' && previousStatus !== 'APPROVED') {
      const leaveType = await prisma.leaveType.findFirst({
        where: {
          schoolId: user.schoolId,
          OR: [{ code: existingLeave.leaveType }, { name: existingLeave.leaveType }],
        },
      });

      if (leaveType) {
        await prisma.teacherLeaveBalance.updateMany({
          where: { teacherId: existingLeave.employeeId, leaveTypeId: leaveType.id },
          data: { usedDays: { increment: days } },
        });
      }
    } else if (previousStatus === 'APPROVED' && status === 'REJECTED') {
      // Restore days if approval revoked
      const leaveType = await prisma.leaveType.findFirst({
        where: {
          schoolId: user.schoolId,
          OR: [{ code: existingLeave.leaveType }, { name: existingLeave.leaveType }],
        },
      });

      if (leaveType) {
        await prisma.teacherLeaveBalance.updateMany({
          where: { teacherId: existingLeave.employeeId, leaveTypeId: leaveType.id },
          data: { usedDays: { decrement: days } },
        });
      }
    }

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: `LEAVE_${status}`,
      resource: `Leave application #${leaveId}`,
      newValue: { previousStatus, newStatus: status, daysDeducted: status === 'APPROVED' ? days : 0 },
    });

    return NextResponse.json({ success: true, data: leave });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
