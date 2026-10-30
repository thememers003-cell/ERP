import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';
import { logAuditTrail } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const homework = await prisma.homework.findFirst({
      where: {
        id: params.id,
        schoolId: user.schoolId,
      },
      include: {
        subject: true,
        section: {
          include: {
            class: true,
            students: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
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
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    if (!homework) {
      return NextResponse.json({ success: false, error: { message: 'Assignment not found' } }, { status: 404 });
    }

    let meta: any = { entryType: 'HOMEWORK', classwork: '', parentNotice: '', resourceLinks: [], parentSignatures: [] };
    if (homework.attachments) {
      try {
        meta = { ...meta, ...JSON.parse(homework.attachments) };
      } catch {
        meta.resourceLinks = [homework.attachments];
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...homework,
        meta,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    if (!hasPermission(user, 'homework', 'DELETE')) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied: homework.DELETE' } }, { status: 403 });
    }

    const item = await prisma.homework.findFirst({
      where: { id: params.id, schoolId: user.schoolId },
    });

    if (!item) {
      return NextResponse.json({ success: false, error: { message: 'Assignment not found' } }, { status: 404 });
    }

    await prisma.homework.delete({
      where: { id: params.id },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'HOMEWORK_DELETED',
      resource: `Homework: ${item.title}`,
    });

    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
