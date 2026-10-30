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

    const [roles, allPermissions] = await Promise.all([
      prisma.role.findMany({
        where: { schoolId: user.schoolId },
        include: {
          department: true,
          _count: {
            select: {
              userRoles: true,
              permissions: { where: { granted: true } },
            },
          },
          permissions: {
            where: { granted: true },
            include: { permission: true },
          },
        },
        orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      }),
      prisma.permission.findMany({
        orderBy: [{ moduleKey: 'asc' }, { action: 'asc' }],
      }),
    ]);

    const formatted = roles.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description,
      isSystem: r.isSystem,
      departmentName: r.department?.name,
      usersCount: r._count.userRoles,
      grantedPermissionsCount: r._count.permissions,
      grantedPermissionIds: r.permissions.map((p) => p.permissionId),
    }));

    return NextResponse.json({
      success: true,
      data: {
        roles: formatted,
        catalog: allPermissions,
      },
    });
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
      user.roles.includes('ADMIN') ||
      user.permissions.some((p) => p.module === 'settings' && p.action === 'EDIT_ROLES');

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied to create roles' } }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, description, departmentId, permissionIds } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: { message: 'Role name and code are required' } }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim().replace(/[^A-Z0-9_]+/g, '_');

    // Check unique role code
    const existing = await prisma.role.findUnique({
      where: {
        schoolId_code: {
          schoolId: user.schoolId,
          code: cleanCode,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: { message: `Role code '${cleanCode}' already exists` } }, { status: 409 });
    }

    const role = await prisma.role.create({
      data: {
        schoolId: user.schoolId,
        name,
        code: cleanCode,
        description,
        departmentId: departmentId || null,
        isSystem: false,
      },
    });

    // Assign chosen permissions
    if (Array.isArray(permissionIds) && permissionIds.length > 0) {
      for (const pId of permissionIds) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: pId,
            granted: true,
          },
        });
      }
    }

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'ROLE_CREATED',
      resource: `Role ${role.name} (${role.code})`,
      newValue: { name, code: cleanCode, grantedPermissionsCount: permissionIds?.length || 0 },
    });

    return NextResponse.json({ success: true, data: role });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
