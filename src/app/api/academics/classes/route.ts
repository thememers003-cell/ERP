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

    const classes = await prisma.classGrade.findMany({
      where: { schoolId: user.schoolId },
      include: {
        sections: {
          include: {
            classTeacher: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
            _count: { select: { students: true } },
          },
        },
        _count: { select: { students: true } },
      },
      orderBy: { numericLevel: 'asc' },
    });

    const formatted = classes.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      numericLevel: c.numericLevel,
      totalStudents: c._count.students,
      sections: c.sections.map((s) => ({
        id: s.id,
        name: s.name,
        roomNumber: s.roomNumber,
        studentsCount: s._count.students,
        classTeacherId: s.classTeacherId,
        classTeacherName: s.classTeacher ? `${s.classTeacher.user.firstName} ${s.classTeacher.user.lastName}` : null,
        classTeacher: s.classTeacher
          ? {
              id: s.classTeacher.id,
              name: `${s.classTeacher.user.firstName} ${s.classTeacher.user.lastName}`,
            }
          : null,
      })),
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
    const { name, code, numericLevel, sectionNames } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: { message: 'Class name and code are required' } }, { status: 400 });
    }

    // Get current academic year
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: { currentYearId: true },
    });

    if (!school?.currentYearId) {
      return NextResponse.json({ success: false, error: { message: 'No active academic year found for school' } }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();

    const existing = await prisma.classGrade.findUnique({
      where: {
        schoolId_academicYearId_code: {
          schoolId: user.schoolId,
          academicYearId: school.currentYearId,
          code: cleanCode,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: `Class code '${cleanCode}' already exists for this academic session` } },
        { status: 409 }
      );
    }

    const classGrade = await prisma.classGrade.create({
      data: {
        schoolId: user.schoolId,
        academicYearId: school.currentYearId,
        name,
        code: cleanCode,
        numericLevel: Number(numericLevel) || 1,
      },
    });

    // Create sections if provided
    const sectionsToCreate = Array.isArray(sectionNames) && sectionNames.length > 0 ? sectionNames : ['Section A'];
    for (const secName of sectionsToCreate) {
      await prisma.section.create({
        data: {
          schoolId: user.schoolId,
          classId: classGrade.id,
          name: secName,
        },
      });
    }

    await logAuditTrail({
      schoolId: user.schoolId,
      actorId: user.id,
      action: 'CLASS_CREATED',
      resource: `Class ${classGrade.name} (${classGrade.code})`,
    });

    return NextResponse.json({ success: true, data: classGrade });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
