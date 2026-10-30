import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const queryTeacherId = searchParams.get('teacherId');

    const isAdmin =
      user.isSuperAdmin ||
      user.roles.includes('SCHOOL_OWNER') ||
      user.roles.includes('PRINCIPAL') ||
      user.roles.includes('ADMIN');

    // Find teacher profile for user
    const teacher = await prisma.teacher.findFirst({
      where: { userId: user.id },
    });

    const targetTeacherId = teacher?.id || (isAdmin && queryTeacherId ? queryTeacherId : null);

    if (!targetTeacherId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const tasks = await prisma.teacherTask.findMany({
      where: { teacherId: targetTeacherId },
      orderBy: [{ isCompleted: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await req.json();
    const { title, priority, teacherId: explicitTeacherId } = body;

    const isAdmin =
      user.isSuperAdmin ||
      user.roles.includes('SCHOOL_OWNER') ||
      user.roles.includes('PRINCIPAL') ||
      user.roles.includes('ADMIN');

    let teacher = await prisma.teacher.findFirst({
      where: { userId: user.id },
    });

    const effectiveTeacherId = teacher?.id || (isAdmin && explicitTeacherId ? explicitTeacherId : null);

    if (!effectiveTeacherId) {
      return NextResponse.json({ success: false, error: { message: 'Active teacher profile required to manage faculty tasks' } }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ success: false, error: { message: 'Task title is required' } }, { status: 400 });
    }

    const task = await prisma.teacherTask.create({
      data: {
        teacherId: effectiveTeacherId,
        title,
        priority: priority || 'MEDIUM',
        isCompleted: false,
      },
    });

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await req.json();
    const id = body.taskId || body.id;
    const isCompleted = body.isCompleted !== undefined ? Boolean(body.isCompleted) : body.status === 'DONE';

    const task = await prisma.teacherTask.update({
      where: { id },
      data: { isCompleted },
    });

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('id');

    if (!taskId) {
      return NextResponse.json({ success: false, error: { message: 'Task ID required' } }, { status: 400 });
    }

    await prisma.teacherTask.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true, message: 'Task deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
