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

    const departments = await prisma.department.findMany({
      where: { schoolId: user.schoolId },
      include: {
        _count: {
          select: {
            teachers: true,
            roles: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Resolve HOD user names
    const hodUserIds = departments.map((d) => d.hodUserId).filter(Boolean) as string[];
    const hodUsers = await prisma.user.findMany({
      where: { id: { in: hodUserIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const hodMap = new Map(hodUsers.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

    const formatted = departments.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description,
      status: d.status,
      hodUserId: d.hodUserId,
      hodName: d.hodUserId ? hodMap.get(d.hodUserId) || 'Assigned' : 'Unassigned',
      teachersCount: d._count.teachers,
      rolesCount: d._count.roles,
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

    const body = await req.json();
    const { name, code, description, hodUserId } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: { message: 'Department name and code are required' } }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();

    const existing = await prisma.department.findUnique({
      where: {
        schoolId_code: {
          schoolId: user.schoolId,
          code: cleanCode,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: { message: `Department code '${cleanCode}' already exists` } }, { status: 409 });
    }

    const dept = await prisma.department.create({
      data: {
        schoolId: user.schoolId,
        name,
        code: cleanCode,
        description,
        hodUserId: hodUserId || null,
      },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'DEPARTMENT_CREATED',
      resource: `Department ${dept.name} (${dept.code})`,
    });

    return NextResponse.json({ success: true, data: dept });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
