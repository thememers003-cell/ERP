import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
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
        { success: false, error: { message: 'Permission denied: Only Administrators can auto-sequence roll numbers' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { classId, sectionId, startFrom = 1, padZero = true } = body;

    if (!classId) {
      return NextResponse.json({ success: false, error: { message: 'Class ID is required' } }, { status: 400 });
    }

    const where: any = {
      schoolId: user.schoolId,
      classId,
      status: 'ACTIVE',
    };
    if (sectionId && sectionId !== 'ALL') {
      where.sectionId = sectionId;
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true } },
        class: { select: { name: true } },
        section: { select: { name: true } },
      },
      orderBy: [
        { user: { firstName: 'asc' } },
        { user: { lastName: 'asc' } },
      ],
    });

    if (students.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'No active students found in the selected class/section' } },
        { status: 404 }
      );
    }

    const updates: Array<{ id: string; name: string; oldRoll: string | null; newRoll: string }> = [];
    let currentNum = Number(startFrom) || 1;

    for (const student of students) {
      const formattedRoll = padZero && currentNum < 10 ? `0${currentNum}` : String(currentNum);
      await prisma.student.update({
        where: { id: student.id },
        data: { rollNumber: formattedRoll },
      });

      updates.push({
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        oldRoll: student.rollNumber,
        newRoll: formattedRoll,
      });

      currentNum++;
    }

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'AUTO_ROLL_NUMBERS_ASSIGNED',
      resource: `${students[0]?.class?.name || 'Class'} ${sectionId && sectionId !== 'ALL' ? `(${students[0]?.section?.name})` : ''}`,
      newValue: { count: updates.length, startFrom },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully re-sequenced roll numbers for ${updates.length} students alphabetically`,
      data: {
        count: updates.length,
        updates,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
