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

    if (!classId) {
      return NextResponse.json({ success: false, error: { message: 'Class ID is required' } }, { status: 400 });
    }

    const [allSubjects, allocations] = await Promise.all([
      prisma.subject.findMany({
        where: { schoolId: user.schoolId },
        orderBy: { name: 'asc' },
      }),
      prisma.classSubject.findMany({
        where: {
          classId,
          sectionId: sectionId ? sectionId : null,
        },
        include: {
          teacher: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
        },
      }),
    ]);

    const allocationMap = new Map(allocations.map((a) => [a.subjectId, a]));

    const result = allSubjects.map((sub) => {
      const alloc = allocationMap.get(sub.id);
      return {
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        subjectType: sub.type,
        teacherId: alloc?.teacherId || null,
        teacherName: alloc?.teacher ? `${alloc.teacher.user.firstName} ${alloc.teacher.user.lastName}` : null,
        teacherCode: alloc?.teacher?.employeeCode || null,
      };
    });

    return NextResponse.json({ success: true, data: result });
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

    const isAuthorized =
      user.isSuperAdmin ||
      user.roles.includes('SCHOOL_OWNER') ||
      user.roles.includes('ADMIN');

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: { message: 'Permission denied: Only Administrators can allocate subject teachers' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { classId, sectionId, subjectId, teacherId } = body;

    if (!classId || !subjectId) {
      return NextResponse.json({ success: false, error: { message: 'Class ID and Subject ID are required' } }, { status: 400 });
    }

    const normalizedSectionId = sectionId && sectionId !== 'ALL' ? sectionId : null;

    let previousTeacherUserId: string | null = null;
    const existingAlloc = await prisma.classSubject.findFirst({
      where: {
        classId,
        sectionId: normalizedSectionId,
        subjectId,
      },
      include: { teacher: true },
    });
    if (existingAlloc?.teacher) {
      previousTeacherUserId = existingAlloc.teacher.userId;
    }

    let allocatedRecord;
    if (existingAlloc) {
      allocatedRecord = await prisma.classSubject.update({
        where: { id: existingAlloc.id },
        data: { teacherId: teacherId || null },
        include: {
          subject: true,
          teacher: { include: { user: true } },
        },
      });
    } else {
      allocatedRecord = await prisma.classSubject.create({
        data: {
          classId,
          sectionId: normalizedSectionId,
          subjectId,
          teacherId: teacherId || null,
        },
        include: {
          subject: true,
          teacher: { include: { user: true } },
        },
      });
    }

    // Synchronize UserPermissionScope for subject teacher
    if (teacherId && allocatedRecord.teacher) {
      if (previousTeacherUserId && previousTeacherUserId !== allocatedRecord.teacher.userId) {
        await prisma.userPermissionScope.deleteMany({
          where: {
            userId: previousTeacherUserId,
            classId,
            sectionId: normalizedSectionId,
            subjectId,
          },
        });
      }

      const existingScope = await prisma.userPermissionScope.findFirst({
        where: {
          userId: allocatedRecord.teacher.userId,
          classId,
          sectionId: normalizedSectionId,
          subjectId,
        },
      });

      if (!existingScope) {
        await prisma.userPermissionScope.create({
          data: {
            userId: allocatedRecord.teacher.userId,
            classId,
            sectionId: normalizedSectionId,
            subjectId,
          },
        });
      }
    } else if (!teacherId && previousTeacherUserId) {
      await prisma.userPermissionScope.deleteMany({
        where: {
          userId: previousTeacherUserId,
          classId,
          sectionId: normalizedSectionId,
          subjectId,
        },
      });
    }

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'SUBJECT_TEACHER_ALLOCATED',
      resource: `${allocatedRecord.subject.name} in Class #${classId}`,
      newValue: {
        subjectId,
        teacherId,
        sectionId: normalizedSectionId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Updated subject teacher allocation for ${allocatedRecord.subject.name}`,
      data: allocatedRecord,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
