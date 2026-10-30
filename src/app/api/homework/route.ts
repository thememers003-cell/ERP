import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAuditTrail } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    if (!hasPermission(user, 'homework', 'VIEW')) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied: homework.VIEW' } }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get('sectionId');
    const subjectId = searchParams.get('subjectId');
    const entryType = searchParams.get('type'); // 'ALL' | 'HOMEWORK' | 'DIARY'
    const dateParam = searchParams.get('date'); // optional 'YYYY-MM-DD' filter for diary

    const where: any = { schoolId: user.schoolId };

    // Resolve student context if student or parent
    let studentId: string | null = null;
    let parentName: string | null = null;

    if (user.roles.includes('STUDENT')) {
      const student = await prisma.student.findFirst({
        where: { userId: user.id },
      });
      if (student?.sectionId) {
        where.sectionId = student.sectionId;
        studentId = student.id;
      }
    } else if (user.roles.includes('PARENT')) {
      const parent = await prisma.parent.findFirst({
        where: { userId: user.id },
        include: {
          studentLinks: {
            include: { student: true },
          },
        },
      });
      if (parent && parent.studentLinks.length > 0) {
        studentId = parent.studentLinks[0].student.id;
        where.sectionId = parent.studentLinks[0].student.sectionId;
        parentName = `${user.firstName} ${user.lastName}`;
      }
    } else if (sectionId && sectionId !== 'ALL') {
      where.sectionId = sectionId;
    }

    if (subjectId && subjectId !== 'ALL') {
      where.subjectId = subjectId;
    }

    const homeworks = await prisma.homework.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, code: true } },
        section: {
          include: {
            class: { select: { name: true } },
            _count: { select: { students: true } },
          },
        },
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        submissions: {
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
          },
        },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = homeworks.map((h) => {
      // Parse attachments metadata if JSON
      let meta: any = {
        entryType: 'HOMEWORK',
        classwork: '',
        parentNotice: '',
        resourceLinks: [],
        parentSignatures: [],
      };

      if (h.attachments) {
        try {
          const parsed = JSON.parse(h.attachments);
          if (typeof parsed === 'object' && parsed !== null) {
            meta = { ...meta, ...parsed };
          }
        } catch {
          // If plain URL string
          meta.resourceLinks = [h.attachments];
        }
      }

      // Check student submission
      let mySubmission: any = null;
      if (studentId) {
        const found = h.submissions.find((s) => s.studentId === studentId);
        if (found) {
          mySubmission = {
            id: found.id,
            submittedAt: found.submittedAt,
            content: found.content,
            attachments: found.attachments,
            marksAwarded: found.marksAwarded,
            feedback: found.feedback,
            status: found.status,
          };
        }
      }

      // Check parent signature
      const isDiarySigned = studentId
        ? meta.parentSignatures?.some((sig: any) => sig.studentId === studentId || sig.userId === user.id)
        : false;

      return {
        id: h.id,
        title: h.title,
        description: h.description,
        dueDate: h.dueDate,
        maxMarks: h.maxMarks,
        status: h.status,
        entryType: meta.entryType || 'HOMEWORK',
        classwork: meta.classwork || '',
        parentNotice: meta.parentNotice || '',
        resourceLinks: meta.resourceLinks || [],
        parentSignatures: meta.parentSignatures || [],
        subjectName: h.subject?.name || 'General',
        subjectCode: h.subject?.code || 'GEN',
        className: h.section?.class?.name || 'Class',
        sectionName: h.section?.name || 'Section',
        sectionId: h.sectionId,
        teacherName: h.teacher?.user ? `${h.teacher.user.firstName} ${h.teacher.user.lastName}` : 'Instructor',
        totalStudents: h.section?._count.students || 32,
        submissionsCount: h._count.submissions,
        submissions: h.submissions.map((s) => ({
          id: s.id,
          studentId: s.studentId,
          studentName: `${s.student.user.firstName} ${s.student.user.lastName}`,
          submittedAt: s.submittedAt,
          content: s.content,
          attachments: s.attachments,
          marksAwarded: s.marksAwarded,
          feedback: s.feedback,
          status: s.status,
        })),
        mySubmission,
        isDiarySigned,
        createdAt: h.createdAt,
      };
    });

    // Optional filter by entryType
    let results = formatted;
    if (entryType && entryType !== 'ALL') {
      results = results.filter((item) => item.entryType === entryType);
    }

    // Optional filter by date
    if (dateParam) {
      results = results.filter((item) => {
        const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
        const dueDate = new Date(item.dueDate).toISOString().split('T')[0];
        return itemDate === dateParam || dueDate === dateParam;
      });
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Error fetching homework/diary:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    if (!hasPermission(user, 'homework', 'CREATE')) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied: homework.CREATE' } }, { status: 403 });
    }

    const body = await req.json();
    const {
      entryType = 'HOMEWORK',
      sectionId,
      subjectId,
      title,
      description,
      classwork,
      parentNotice,
      resourceLinks = [],
      dueDate,
      maxMarks = 50,
    } = body;

    if (!sectionId || !subjectId || !title) {
      return NextResponse.json(
        { success: false, error: { message: 'Section, subject, and title are required' } },
        { status: 400 }
      );
    }

    // Resolve teacher record
    let teacher = await prisma.teacher.findFirst({
      where: { userId: user.id },
    });

    if (!teacher) {
      teacher = await prisma.teacher.findFirst({
        where: { schoolId: user.schoolId },
      });
    }

    if (!teacher) {
      return NextResponse.json({ success: false, error: { message: 'No registered teacher profile found' } }, { status: 400 });
    }

    // Pack rich metadata into attachments field
    const metadata = {
      entryType,
      classwork: classwork || '',
      parentNotice: parentNotice || '',
      resourceLinks: Array.isArray(resourceLinks)
        ? resourceLinks
        : resourceLinks ? [resourceLinks] : [],
      parentSignatures: [],
    };

    const targetDueDate = dueDate
      ? new Date(dueDate)
      : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    const hw = await prisma.homework.create({
      data: {
        schoolId: user.schoolId,
        sectionId,
        subjectId,
        teacherId: teacher.id,
        title,
        description: description || (classwork ? `Classwork: ${classwork}` : ''),
        attachments: JSON.stringify(metadata),
        dueDate: targetDueDate,
        maxMarks: Number(maxMarks) || 50,
        status: 'PUBLISHED',
      },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: entryType === 'DIARY' ? 'DAILY_DIARY_PUBLISHED' : 'HOMEWORK_PUBLISHED',
      resource: `${entryType === 'DIARY' ? 'Daily Diary' : 'Homework'}: ${hw.title}`,
    });

    return NextResponse.json({ success: true, data: hw });
  } catch (error: any) {
    console.error('Error publishing homework/diary:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
