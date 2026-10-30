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
    const audience = searchParams.get('audience');

    const where: any = { schoolId: user.schoolId };
    if (audience && audience !== 'ALL') {
      where.OR = [{ targetAudience: 'ALL' }, { targetAudience: audience }];
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ success: true, data: announcements });
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

    const body = await req.json();
    const { title, content, category, targetAudience } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, error: { message: 'Title and content are required' } }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        schoolId: user.schoolId,
        title,
        content,
        category: category || 'GENERAL',
        targetAudience: targetAudience || 'ALL',
        postedByName: `${user.firstName} ${user.lastName} (${user.roles[0] || 'Admin'})`,
      },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'ANNOUNCEMENT_POSTED',
      resource: `Notice: ${title}`,
    });

    return NextResponse.json({ success: true, data: announcement });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
