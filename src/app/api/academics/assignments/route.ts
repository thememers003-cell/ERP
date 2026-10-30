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
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const teacherId = searchParams.get('teacherId');

    // 1. Fetch all classes with sections
    const classes = await prisma.classGrade.findMany({
      where: { schoolId: user.schoolId },
      include: {
        sections: {
          include: {
            classTeacher: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { numericLevel: 'asc' },
    });

    // 2. Fetch all subjects
    const subjects = await prisma.subject.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { name: 'asc' },
    });

    // 3. Fetch all active faculty/teachers
    const teachers = await prisma.teacher.findMany({
      where: { schoolId: user.schoolId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, status: true } },
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: { employeeCode: 'asc' },
    });

    // 4. Query ClassSubject allocations
    const whereClause: any = {
      class: { schoolId: user.schoolId },
    };
    if (classId) whereClause.classId = classId;
    if (sectionId) whereClause.sectionId = sectionId;
    if (teacherId) whereClause.teacherId = teacherId;

    const assignments = await prisma.classSubject.findMany({
      where: whereClause,
      include: {
        class: { select: { id: true, name: true, code: true, numericLevel: true } },
        section: { select: { id: true, name: true, roomNumber: true } },
        subject: { select: { id: true, name: true, code: true, type: true } },
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [
        { class: { numericLevel: 'asc' } },
        { section: { name: 'asc' } },
        { subject: { name: 'asc' } },
      ],
    });

    const formattedAssignments = assignments.map((a) => ({
      id: a.id,
      classId: a.classId,
      className: a.class.name,
      classCode: a.class.code,
      sectionId: a.sectionId,
      sectionName: a.section ? a.section.name : 'All Sections',
      roomNumber: a.section ? a.section.roomNumber : null,
      subjectId: a.subjectId,
      subjectName: a.subject.name,
      subjectCode: a.subject.code,
      subjectType: a.subject.type,
      teacherId: a.teacherId,
      teacherName: a.teacher
        ? `${a.teacher.user.firstName} ${a.teacher.user.lastName}`
        : 'Unassigned',
      teacherEmail: a.teacher ? a.teacher.user.email : null,
      employeeCode: a.teacher ? a.teacher.employeeCode : null,
      department: a.teacher?.department?.name || null,
      designation: a.teacher ? a.teacher.designation : null,
    }));

    const formattedClasses = classes.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      numericLevel: c.numericLevel,
      sections: c.sections.map((s) => ({
        id: s.id,
        name: s.name,
        roomNumber: s.roomNumber,
        classTeacherName: s.classTeacher
          ? `${s.classTeacher.user.firstName} ${s.classTeacher.user.lastName}`
          : 'Unassigned',
      })),
    }));

    const formattedTeachers = teachers.map((t) => ({
      id: t.id,
      employeeCode: t.employeeCode,
      name: `${t.user.firstName} ${t.user.lastName}`,
      email: t.user.email,
      designation: t.designation,
      department: t.department ? t.department.name : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        assignments: formattedAssignments,
        classes: formattedClasses,
        subjects,
        teachers: formattedTeachers,
      },
    });
  } catch (error: any) {
    console.error('Error fetching course assignments:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await req.json();
    const { classId, sectionId, subjectId, teacherId } = body;

    if (!classId || !subjectId) {
      return NextResponse.json(
        { success: false, error: { message: 'classId and subjectId are required' } },
        { status: 400 }
      );
    }

    // Verify ownership
    const classGrade = await prisma.classGrade.findFirst({
      where: { id: classId, schoolId: user.schoolId },
    });
    if (!classGrade) {
      return NextResponse.json({ success: false, error: { message: 'Class not found in this school' } }, { status: 404 });
    }

    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId: user.schoolId },
    });
    if (!subject) {
      return NextResponse.json({ success: false, error: { message: 'Subject not found in this school' } }, { status: 404 });
    }

    if (sectionId) {
      const section = await prisma.section.findFirst({
        where: { id: sectionId, classId, schoolId: user.schoolId },
      });
      if (!section) {
        return NextResponse.json({ success: false, error: { message: 'Section not found for this class' } }, { status: 404 });
      }
    }

    let teacherName = 'Unassigned';
    if (teacherId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: teacherId, schoolId: user.schoolId },
        include: { user: { select: { firstName: true, lastName: true } } },
      });
      if (!teacher) {
        return NextResponse.json({ success: false, error: { message: 'Teacher not found in this school' } }, { status: 404 });
      }
      teacherName = `${teacher.user.firstName} ${teacher.user.lastName}`;
    }

    const cleanSectionId = sectionId || null;
    const cleanTeacherId = teacherId || null;

    // Check if an existing mapping exists
    const existing = await prisma.classSubject.findFirst({
      where: {
        classId,
        sectionId: cleanSectionId,
        subjectId,
      },
    });

    let result;
    if (existing) {
      result = await prisma.classSubject.update({
        where: { id: existing.id },
        data: { teacherId: cleanTeacherId },
        include: {
          class: true,
          section: true,
          subject: true,
          teacher: { include: { user: true } },
        },
      });
    } else {
      result = await prisma.classSubject.create({
        data: {
          classId,
          sectionId: cleanSectionId,
          subjectId,
          teacherId: cleanTeacherId,
        },
        include: {
          class: true,
          section: true,
          subject: true,
          teacher: { include: { user: true } },
        },
      });
    }

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'FACULTY_SUBJECT_ASSIGNED',
      resource: 'ClassSubject',
      resourceId: result.id,
      newValue: {
        classId,
        sectionId: cleanSectionId,
        subjectId,
        teacherId: cleanTeacherId,
        teacherName,
        className: classGrade.name,
        subjectName: subject.name,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        classId: result.classId,
        className: result.class.name,
        sectionId: result.sectionId,
        sectionName: result.section?.name || 'All Sections',
        subjectId: result.subjectId,
        subjectName: result.subject.name,
        teacherId: result.teacherId,
        teacherName,
      },
    });
  } catch (error: any) {
    console.error('Error assigning faculty to subject:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: { message: 'Assignment ID is required' } }, { status: 400 });
    }

    const existing = await prisma.classSubject.findUnique({
      where: { id },
      include: { class: true },
    });

    if (!existing || existing.class.schoolId !== user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Assignment record not found' } }, { status: 404 });
    }

    await prisma.classSubject.delete({
      where: { id },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'FACULTY_SUBJECT_UNASSIGNED',
      resource: 'ClassSubject',
      resourceId: id,
    });

    return NextResponse.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error('Error removing course assignment:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
