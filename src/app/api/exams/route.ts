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

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    if (!hasPermission(user, 'examinations', 'VIEW')) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied: examinations.VIEW' } }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get('examId');

    const exams = await prisma.exam.findMany({
      where: { schoolId: user.schoolId },
      include: {
        academicYear: true,
        schedules: {
          include: {
            subject: true,
            marks: {
              include: {
                student: {
                  include: {
                    user: { select: { firstName: true, lastName: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    let currentStudentId: string | null = null;
    if (user.roles.includes('STUDENT')) {
      const student = await prisma.student.findFirst({
        where: { userId: user.id },
      });
      currentStudentId = student?.id || 'none';
    }

    const formatted = exams.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      startDate: e.startDate,
      endDate: e.endDate,
      status: e.status,
      academicYearName: e.academicYear?.name || 'Academic Year',
      schedules: e.schedules.map((s) => {
        const filteredMarks = currentStudentId
          ? s.marks.filter((m) => m.studentId === currentStudentId)
          : s.marks;

        return {
          id: s.id,
          subjectName: s.subject?.name || 'Subject',
          subjectCode: s.subject?.code || 'SUB',
          date: s.date,
          maxMarks: s.maxMarks,
          passingMarks: s.passingMarks,
          marksEnteredCount: s.marks.length,
          marks: filteredMarks.map((m) => ({
            id: m.id,
            studentId: m.studentId,
            studentName: m.student?.user ? `${m.student.user.firstName} ${m.student.user.lastName}` : 'Student',
            admissionNumber: m.student?.admissionNumber || 'N/A',
            marksObtained: m.marksObtained,
            grade: m.grade,
            remarks: m.remarks,
          })),
        };
      }),
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

    if (user.roles.includes('STUDENT') || (!hasPermission(user, 'examinations', 'ENTER_MARKS') && !hasPermission(user, 'examinations', 'CREATE'))) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied: examinations.ENTER_MARKS' } }, { status: 403 });
    }

    const body = await req.json();
    const { examScheduleId, marks, studentId, marksObtained, remarks } = body;

    if (!examScheduleId) {
      return NextResponse.json(
        { success: false, error: { message: 'examScheduleId is required' } },
        { status: 400 }
      );
    }

    const schedule = await prisma.examSchedule.findUnique({
      where: { id: examScheduleId },
    });

    if (!schedule) {
      return NextResponse.json({ success: false, error: { message: 'Exam schedule not found' } }, { status: 404 });
    }

    // Support batch marks submission
    if (Array.isArray(marks) && marks.length > 0) {
      const results = [];
      for (const item of marks) {
        if (!item.studentId || item.marksObtained === undefined || item.marksObtained === null || item.marksObtained === '') {
          continue;
        }
        const score = Number(item.marksObtained);
        if (isNaN(score)) continue;
        const grade = calculateGrade(score, schedule.maxMarks);

        const savedMark = await prisma.mark.upsert({
          where: {
            examScheduleId_studentId: {
              examScheduleId,
              studentId: item.studentId,
            },
          },
          update: {
            marksObtained: score,
            grade,
            remarks: item.remarks || null,
          },
          create: {
            examScheduleId,
            studentId: item.studentId,
            marksObtained: score,
            grade,
            remarks: item.remarks || null,
          },
        });
        results.push(savedMark);
      }

      await logAuditTrail({
        schoolId: user.schoolId,
        actorId: user.id,
        action: 'EXAM_MARKS_RECORDED',
        resource: `Batch marks updated for schedule ${schedule.id} (${results.length} students)`,
      });

      return NextResponse.json({ success: true, count: results.length, data: results });
    }

    // Single student mark upsert
    if (!studentId || marksObtained === undefined) {
      return NextResponse.json(
        { success: false, error: { message: 'studentId and marksObtained are required' } },
        { status: 400 }
      );
    }

    const score = Number(marksObtained);
    const grade = calculateGrade(score, schedule.maxMarks);

    const mark = await prisma.mark.upsert({
      where: {
        examScheduleId_studentId: {
          examScheduleId,
          studentId,
        },
      },
      update: {
        marksObtained: score,
        grade,
        remarks: remarks || null,
      },
      create: {
        examScheduleId,
        studentId,
        marksObtained: score,
        grade,
        remarks: remarks || null,
      },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'EXAM_MARKS_RECORDED',
      resource: `Mark: ${score}/${schedule.maxMarks} (${grade})`,
      newValue: { examScheduleId, studentId, score, grade },
    });

    return NextResponse.json({ success: true, data: mark });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
