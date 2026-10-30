import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditTrail } from '@/lib/audit';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { success: false, error: { message: 'Permission denied: Only Administrators can assign class teachers' } },
        { status: 403 }
      );
    }

    const sectionId = params.id;
    const body = await req.json();
    const { classTeacherId } = body;

    const section = await prisma.section.findFirst({
      where: { id: sectionId, schoolId: user.schoolId },
      include: {
        classTeacher: { include: { user: true } },
        class: true,
      },
    });

    if (!section) {
      return NextResponse.json({ success: false, error: { message: 'Section not found' } }, { status: 404 });
    }

    const previousTeacherUserId = section.classTeacher?.userId;

    if (classTeacherId) {
      // Validate teacher belongs to this school
      const teacher = await prisma.teacher.findFirst({
        where: { id: classTeacherId, schoolId: user.schoolId },
        include: { user: true },
      });

      if (!teacher) {
        return NextResponse.json({ success: false, error: { message: 'Teacher not found' } }, { status: 404 });
      }

      // If there was a different previous teacher, clean up their specific section scope
      if (previousTeacherUserId && previousTeacherUserId !== teacher.userId) {
        await prisma.userPermissionScope.deleteMany({
          where: {
            userId: previousTeacherUserId,
            sectionId: section.id,
          },
        });
      }

      // Update section
      const updatedSection = await prisma.section.update({
        where: { id: sectionId },
        data: { classTeacherId },
        include: {
          classTeacher: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
        },
      });

      // Grant / Sync UserPermissionScope for the new teacher
      const existingScope = await prisma.userPermissionScope.findFirst({
        where: {
          userId: teacher.userId,
          sectionId: section.id,
        },
      });

      if (!existingScope) {
        await prisma.userPermissionScope.create({
          data: {
            userId: teacher.userId,
            classId: section.classId,
            sectionId: section.id,
          },
        });
      }

      await logAuditTrail({
        schoolId: user.schoolId,
        actorId: user.id,
        action: 'CLASS_TEACHER_ASSIGNED',
        resource: `${section.class.name} - ${section.name}`,
        newValue: {
          teacherId: teacher.id,
          teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`,
          sectionId: section.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Assigned ${teacher.user.firstName} ${teacher.user.lastName} as Class Teacher for ${section.class.name} - ${section.name}`,
        data: updatedSection,
      });
    } else {
      // Unassign Class Teacher
      if (previousTeacherUserId) {
        await prisma.userPermissionScope.deleteMany({
          where: {
            userId: previousTeacherUserId,
            sectionId: section.id,
          },
        });
      }

      const updatedSection = await prisma.section.update({
        where: { id: sectionId },
        data: { classTeacherId: null },
      });

      await logAuditTrail({
        schoolId: user.schoolId,
        actorId: user.id,
        action: 'CLASS_TEACHER_UNASSIGNED',
        resource: `${section.class.name} - ${section.name}`,
      });

      return NextResponse.json({
        success: true,
        message: `Class Teacher unassigned for ${section.class.name} - ${section.name}`,
        data: updatedSection,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
