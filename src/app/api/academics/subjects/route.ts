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

    const subjects = await prisma.subject.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: subjects });
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
    const { name, code, type } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: { message: 'Subject name and code are required' } }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();

    const existing = await prisma.subject.findUnique({
      where: {
        schoolId_code: {
          schoolId: user.schoolId,
          code: cleanCode,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: `Subject code '${cleanCode}' already exists` } },
        { status: 409 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        schoolId: user.schoolId,
        name,
        code: cleanCode,
        type: type || 'THEORY',
      },
    });

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'SUBJECT_CREATED',
      resource: `Subject ${subject.name} (${subject.code})`,
    });

    return NextResponse.json({ success: true, data: subject });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
