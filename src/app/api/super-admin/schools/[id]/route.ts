import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, signToken, setAuthCookie } from '@/lib/auth';
import { logAuditTrail } from '@/lib/audit';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const schoolId = params.id;
    const body = await req.json();
    const { status, name, phone, email, planId, action } = body;

    // Impersonation action
    if (action === 'IMPERSONATE') {
      const targetSchool = await prisma.school.findUnique({
        where: { id: schoolId },
      });

      if (!targetSchool) {
        return NextResponse.json({ success: false, error: { message: 'School not found' } }, { status: 404 });
      }

      const token = signToken({
        userId: user.id,
        email: user.email,
        isSuperAdmin: true,
        schoolId: schoolId,
        impersonatedSchoolId: schoolId,
      });

      const res = NextResponse.json({
        success: true,
        message: `Impersonating ${targetSchool.name}`,
        data: { schoolId },
      });
      setAuthCookie(res, token);

      await logAuditTrail({
        schoolId,
        actorId: user.id,
        action: 'SUPER_ADMIN_IMPERSONATE',
        resource: `School ${targetSchool.name}`,
      });

      return res;
    }

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        ...(status && { status }),
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email && { email }),
        ...(planId && { planId }),
      },
    });

    await logAuditTrail({
      schoolId,
      actorId: user.id,
      action: 'SCHOOL_UPDATED',
      resource: `School ${school.name}`,
      newValue: body,
    });

    return NextResponse.json({ success: true, data: school });
  } catch (error: any) {
    console.error('Error updating school:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
