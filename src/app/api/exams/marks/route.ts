import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAuditTrail } from '@/lib/audit';

function calculateGrade(marks: number, maxMarks: number): string {
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 90) return 'A*';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    if (!hasPermission(user, 'examinations', 'EDIT')) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied: examinations.EDIT' } }, { status: 403 });
    }

    const body = await req.json();
    const { examScheduleId, marks = [] } = body;

    if (!examScheduleId || !Array.isArray(marks) || marks.length === 0) {
      return NextResponse.json({ success: false, error: { message: 'examScheduleId and marks array are required' } }, { status: 400 });
    }

    const schedule = await prisma.examSchedule.findFirst({
      where: {
        id: examScheduleId,
        exam: { schoolId: user.schoolId },
      },
      include: {
        subject: true,
        exam: true,
      },
    });

    if (!schedule) {
      return NextResponse.json({ success: false, error: { message: 'Exam schedule not found' } }, { status: 404 });
    }

    const maxMarks = schedule.maxMarks || 100;
    const upserted = [];

    for (const item of marks) {
      if (!item.studentId) continue;
      const score = item.marksObtained !== '' && item.marksObtained !== null && item.marksObtained !== undefined
        ? Number(item.marksObtained)
        : 0;

      const grade = calculateGrade(score, maxMarks);

      const record = await prisma.mark.upsert({
        where: {
          examScheduleId_studentId: {
            examScheduleId: schedule.id,
            studentId: item.studentId,
          },
        },
        update: {
          marksObtained: score,
          maxMarks,
          grade,
          remarks: item.remarks || '',
        },
        create: {
          examScheduleId: schedule.id,
          studentId: item.studentId,
          marksObtained: score,
          maxMarks,
          grade,
          remarks: item.remarks || '',
        },
      });

      upserted.push(record);
    }

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'EXAM_MARKS_RECORDED',
      resource: `Saved ${upserted.length} student scores for ${schedule.subject?.name} (${schedule.exam?.name})`,
    });

    return NextResponse.json({
      success: true,
      count: upserted.length,
      data: upserted,
    });
  } catch (error: any) {
    console.error('Error saving exam marks:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
