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

    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      include: {
        plan: true,
      },
    });

    if (!school) {
      return NextResponse.json({ success: false, error: { message: 'School not found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: school });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    // Must be School Owner or Admin or have settings.edit_branding permission
    const isAuthorized =
      user.isSuperAdmin ||
      user.roles.includes('SCHOOL_OWNER') ||
      user.roles.includes('ADMIN') ||
      user.permissions.some((p) => p.module === 'settings' && p.action === 'EDIT_BRANDING');

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied to update branding' } }, { status: 403 });
    }

    const body = await req.json();
    const { name, logoUrl, primaryColor, accentColor, phone, email, address, city, state } = body;

    const updated = await prisma.school.update({
      where: { id: user.schoolId },
      data: {
        ...(name && { name }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(primaryColor && { primaryColor }),
        ...(accentColor && { accentColor }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(address && { address }),
        ...(city && { city }),
        ...(state && { state }),
      },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'BRANDING_UPDATED',
      resource: `School ${updated.name}`,
      newValue: { primaryColor, accentColor, logoUrl },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
