import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAuditTrail } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.schoolId) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const homework = await prisma.homework.findFirst({
      where: { id: params.id, schoolId: user.schoolId },
    });

    if (!homework) {
      return NextResponse.json({ success: false, error: { message: 'Diary entry not found' } }, { status: 404 });
    }

    const body = await req.json();
    const { replyNote = '' } = body;

    // Resolve student and parent context
    let studentId: string = 'UNKNOWN';
    if (user.roles.includes('STUDENT')) {
      const stu = await prisma.student.findFirst({ where: { userId: user.id } });
      if (stu) studentId = stu.id;
    } else if (user.roles.includes('PARENT')) {
      const parent = await prisma.parent.findFirst({
        where: { userId: user.id },
        include: { studentLinks: true },
      });
      if (parent && parent.studentLinks.length > 0) {
        studentId = parent.studentLinks[0].studentId;
      }
    }

    // Parse metadata
    let meta: any = { entryType: 'DIARY', classwork: '', parentNotice: '', resourceLinks: [], parentSignatures: [] };
    if (homework.attachments) {
      try {
        meta = { ...meta, ...JSON.parse(homework.attachments) };
      } catch {
        // fallback
      }
    }

    if (!Array.isArray(meta.parentSignatures)) {
      meta.parentSignatures = [];
    }

    // Append new signature (replace old if already signed)
    meta.parentSignatures = meta.parentSignatures.filter((s: any) => s.userId !== user.id && s.studentId !== studentId);
    meta.parentSignatures.push({
      userId: user.id,
      parentName: `${user.firstName} ${user.lastName}`,
      studentId,
      signedAt: new Date().toISOString(),
      replyNote,
    });

    const updated = await prisma.homework.update({
      where: { id: homework.id },
      data: {
        attachments: JSON.stringify(meta),
      },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'DIARY_ACKNOWLEDGED',
      resource: `Signed by ${user.firstName} ${user.lastName} on ${homework.title}`,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        isDiarySigned: true,
        parentSignatures: meta.parentSignatures,
      },
    });
  } catch (error: any) {
    console.error('Error signing diary:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
