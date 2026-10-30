import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { SYSTEM_MODULES } from '@/types';
import { logAuditTrail } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const schoolModules = await prisma.schoolModule.findMany({
      where: { schoolId: user.schoolId },
    });

    const activeKeys = new Set(schoolModules.filter((m) => m.isEnabled).map((m) => m.moduleKey));

    const result = SYSTEM_MODULES.map((m) => ({
      ...m,
      isEnabled: m.isCore || activeKeys.has(m.key),
    }));

    return NextResponse.json({ success: true, data: result });
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
      user.permissions.some((p) => p.module === 'settings' && p.action === 'EDIT_MODULES');

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: { message: 'Permission denied to toggle modules' } }, { status: 403 });
    }

    const { moduleKey, isEnabled } = await req.json();

    const targetModule = SYSTEM_MODULES.find((m) => m.key === moduleKey);
    if (!targetModule) {
      return NextResponse.json({ success: false, error: { message: 'Invalid module key' } }, { status: 400 });
    }

    if (targetModule.isCore && !isEnabled) {
      return NextResponse.json({ success: false, error: { message: 'Core module cannot be disabled' } }, { status: 400 });
    }

    const updated = await prisma.schoolModule.upsert({
      where: {
        schoolId_moduleKey: {
          schoolId: user.schoolId,
          moduleKey,
        },
      },
      update: { isEnabled },
      create: {
        schoolId: user.schoolId,
        moduleKey,
        isEnabled,
      },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'MODULE_TOGGLED',
      resource: `Module ${targetModule.name}`,
      newValue: { moduleKey, isEnabled },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
