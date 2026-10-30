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
      user.roles.includes('ADMIN') ||
      user.permissions.some((p) => p.module === 'settings' && p.action === 'EDIT_ROLES');

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied to edit roles' } }, { status: 403 });
    }

    const roleId = params.id;
    const body = await req.json();
    const { name, description, permissionIds } = body;

    const role = await prisma.role.findFirst({
      where: { id: roleId, schoolId: user.schoolId },
    });

    if (!role) {
      return NextResponse.json({ success: false, error: { message: 'Role not found' } }, { status: 404 });
    }

    await prisma.role.update({
      where: { id: roleId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    // Update permission matrix if provided
    if (Array.isArray(permissionIds)) {
      // Clear existing
      await prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      // Insert new granted permissions
      for (const pId of permissionIds) {
        await prisma.rolePermission.create({
          data: {
            roleId,
            permissionId: pId,
            granted: true,
          },
        });
      }
    }

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'ROLE_UPDATED',
      resource: `Role ${role.name}`,
      newValue: { permissionIdsCount: permissionIds?.length },
    });

    return NextResponse.json({ success: true, message: 'Role updated successfully' });
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

    const roleId = params.id;
    const role = await prisma.role.findFirst({
      where: { id: roleId, schoolId: user.schoolId },
    });

    if (!role) {
      return NextResponse.json({ success: false, error: { message: 'Role not found' } }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json({ success: false, error: { message: 'System baseline roles cannot be deleted' } }, { status: 400 });
    }

    await prisma.role.delete({ where: { id: roleId } });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'ROLE_DELETED',
      resource: `Role ${role.name} (${role.code})`,
    });

    return NextResponse.json({ success: true, message: 'Role removed successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
