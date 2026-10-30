import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAuditTrail } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    if (!hasPermission(user, 'homework', 'EDIT')) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied: homework.EDIT' } }, { status: 403 });
    }

    const homework = await prisma.homework.findFirst({
      where: { id: params.id, schoolId: user.schoolId },
    });

    if (!homework) {
      return NextResponse.json({ success: false, error: { message: 'Assignment not found' } }, { status: 404 });
    }

    const body = await req.json();
    const { studentId, submissionId, marksAwarded, feedback } = body;

    let targetSubmission = null;
    if (submissionId) {
      targetSubmission = await prisma.assignmentSubmission.findUnique({
        where: { id: submissionId },
      });
    } else if (studentId) {
      targetSubmission = await prisma.assignmentSubmission.findUnique({
        where: {
          homeworkId_studentId: {
            homeworkId: homework.id,
            studentId,
          },
        },
      });
    }

    if (!targetSubmission) {
      return NextResponse.json({ success: false, error: { message: 'Submission record not found' } }, { status: 404 });
    }

    const updated = await prisma.assignmentSubmission.update({
      where: { id: targetSubmission.id },
      data: {
        marksAwarded: Number(marksAwarded),
        feedback: feedback || '',
        status: 'EVALUATED',
      },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'HOMEWORK_EVALUATED',
      resource: `Awarded ${marksAwarded}/${homework.maxMarks} on ${homework.title}`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error grading submission:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
