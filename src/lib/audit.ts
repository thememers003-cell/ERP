import { prisma } from './prisma';

export async function logAuditTrail({
  schoolId,
  actorId,
  action,
  resource,
  resourceId,
  oldValue,
  newValue,
  ipAddress,
}: {
  schoolId?: string | null;
  actorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        schoolId: schoolId || null,
        actorId: actorId || null,
        action,
        resource,
        resourceId: resourceId || null,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to log audit trail:', error);
  }
}
