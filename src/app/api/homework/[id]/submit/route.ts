import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
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

    const student = await prisma.student.findFirst({
      where: { userId: user.id },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: { message: 'Only enrolled students can turn in assignments' } }, { status: 403 });
    }

    const homework = await prisma.homework.findFirst({
      where: { id: params.id, schoolId: user.schoolId },
    });

    if (!homework) {
      return NextResponse.json({ success: false, error: { message: 'Assignment not found' } }, { status: 404 });
    }

    const body = await req.json();
    const { content, attachments, action = 'SUBMIT' } = body;

    // Handle Unsubmit action
    if (action === 'UNSUBMIT') {
      const existing = await prisma.assignmentSubmission.findUnique({
        where: {
          homeworkId_studentId: {
            homeworkId: homework.id,
            studentId: student.id,
          },
        },
      });

      if (existing) {
        if (existing.status === 'EVALUATED') {
          return NextResponse.json(
            { success: false, error: { message: 'Cannot unsubmit an assignment that has already been graded' } },
            { status: 400 }
          );
        }
        await prisma.assignmentSubmission.delete({
          where: { id: existing.id },
        });
      }

      return NextResponse.json({ success: true, message: 'Assignment unsubmitted' });
    }

    // Check if late
    const isLate = new Date() > new Date(homework.dueDate);
    const submissionStatus = isLate ? 'LATE' : 'SUBMITTED';

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        homeworkId_studentId: {
          homeworkId: homework.id,
          studentId: student.id,
        },
      },
      update: {
        content: content || '',
        attachments: attachments || null,
        submittedAt: new Date(),
        status: submissionStatus,
      },
      create: {
        homeworkId: homework.id,
        studentId: student.id,
        content: content || '',
        attachments: attachments || null,
        submittedAt: new Date(),
        status: submissionStatus,
      },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'HOMEWORK_SUBMITTED',
      resource: `Turn-in by ${user.firstName} for ${homework.title}`,
    });

    return NextResponse.json({ success: true, data: submission });
  } catch (error: any) {
    console.error('Error submitting homework:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
