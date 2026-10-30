import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const where: any = {};
    if (!user.isSuperAdmin) {
      where.schoolId = user.schoolId;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { firstName: true, lastName: true, email: true } },
        school: { select: { name: true, code: true } },
      },
    });

    const formatted = logs.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      actorName: log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System',
      actorEmail: log.actor?.email,
      schoolName: log.school?.name || 'Platform Global',
      ipAddress: log.ipAddress || '127.0.0.1',
      createdAt: log.createdAt,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
