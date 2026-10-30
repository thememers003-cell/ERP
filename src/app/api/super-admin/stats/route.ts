import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const [
      totalSchools,
      activeSchools,
      inactiveSchools,
      totalStudents,
      totalTeachers,
      totalUsers,
      plans,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.school.count(),
      prisma.school.count({ where: { status: 'ACTIVE' } }),
      prisma.school.count({ where: { status: { in: ['SUSPENDED', 'ARCHIVED'] } } }),
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.user.count(),
      prisma.platformPlan.findMany({
        include: {
          _count: { select: { schools: true } },
        },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { firstName: true, lastName: true, email: true } },
          school: { select: { name: true, code: true } },
        },
      }),
    ]);

    // Calculate approximate monthly platform recurring revenue
    let monthlyRevenue = 0;
    for (const plan of plans) {
      monthlyRevenue += plan.monthlyPrice * plan._count.schools;
    }

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalSchools,
          activeSchools,
          inactiveSchools,
          trialSchools: totalSchools - activeSchools - inactiveSchools,
          totalStudents,
          totalTeachers,
          totalUsers,
          monthlyRevenue,
          systemHealth: '100% Operational',
        },
        plans: plans.map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          monthlyPrice: p.monthlyPrice,
          schoolsCount: p._count.schools,
        })),
        recentActivity: recentAuditLogs.map((log) => ({
          id: log.id,
          action: log.action,
          resource: log.resource,
          schoolName: log.school?.name || 'Platform Global',
          actorName: log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System',
          createdAt: log.createdAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching platform stats:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
