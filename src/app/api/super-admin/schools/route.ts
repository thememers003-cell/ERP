import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { logAuditTrail } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { city: { contains: search } },
      ];
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const schools = await prisma.school.findMany({
      where,
      include: {
        plan: true,
        _count: {
          select: {
            students: true,
            teachers: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = schools.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      slug: s.slug,
      logoUrl: s.logoUrl,
      primaryColor: s.primaryColor,
      accentColor: s.accentColor,
      city: s.city,
      state: s.state,
      country: s.country,
      status: s.status,
      planName: s.plan?.name || 'Standard',
      monthlyPrice: s.plan?.monthlyPrice || 0,
      studentsCount: s._count.students,
      teachersCount: s._count.teachers,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching schools:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !user.isSuperAdmin) {
      return NextResponse.json({ success: false, error: { message: 'Forbidden' } }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      code,
      email,
      phone,
      address,
      city,
      state,
      country,
      schoolType,
      primaryColor,
      accentColor,
      planId,
      ownerFirstName,
      ownerLastName,
      ownerEmail,
      ownerPassword,
    } = body;

    if (!name || !code || !ownerEmail || !ownerPassword) {
      return NextResponse.json(
        { success: false, error: { message: 'School name, code, owner email and password are required' } },
        { status: 400 }
      );
    }

    // Check unique school code
    const existingSchool = await prisma.school.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (existingSchool) {
      return NextResponse.json(
        { success: false, error: { message: `School code '${code}' already exists` } },
        { status: 409 }
      );
    }

    // Check unique owner email
    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail.toLowerCase().trim() } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: `User email '${ownerEmail}' already registered` } },
        { status: 409 }
      );
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // 1. Create School Tenant
    const school = await prisma.school.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        slug,
        email,
        phone,
        address,
        city,
        state,
        country: country || 'India',
        schoolType: schoolType || 'K12',
        primaryColor: primaryColor || '#1d4ed8',
        accentColor: accentColor || '#059669',
        planId: planId || null,
        status: 'ACTIVE',
      },
    });

    // 2. Enable Standard Modules
    const defaultModules = [
      'core_academics',
      'departments',
      'students',
      'teachers',
      'attendance',
      'homework',
      'examinations',
      'fees_billing',
      'communication',
    ];

    for (const modKey of defaultModules) {
      await prisma.schoolModule.create({
        data: {
          schoolId: school.id,
          moduleKey: modKey,
          isEnabled: true,
        },
      });
    }

    // 3. Create Default Academic Year
    const currentYear = new Date().getFullYear();
    const academicYear = await prisma.academicYear.create({
      data: {
        schoolId: school.id,
        name: `Academic Year ${currentYear}-${currentYear + 1}`,
        code: `AY-${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
        startDate: new Date(`${currentYear}-06-01`),
        endDate: new Date(`${currentYear + 1}-04-30`),
        isCurrent: true,
      },
    });

    await prisma.school.update({
      where: { id: school.id },
      data: { currentYearId: academicYear.id },
    });

    // 4. Create Standard System Roles for this School
    const roleOwner = await prisma.role.create({
      data: {
        schoolId: school.id,
        name: 'School Owner',
        code: 'SCHOOL_OWNER',
        description: 'Complete ownership and administrative control',
        isSystem: true,
      },
    });

    const allPermissions = await prisma.permission.findMany();
    for (const p of allPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: roleOwner.id,
          permissionId: p.id,
          granted: true,
        },
      });
    }

    // Create other baseline roles
    await prisma.role.createMany({
      data: [
        { schoolId: school.id, name: 'Principal', code: 'PRINCIPAL', description: 'Academic director', isSystem: true },
        { schoolId: school.id, name: 'Subject Teacher', code: 'SUBJECT_TEACHER', description: 'Classroom teaching faculty', isSystem: true },
        { schoolId: school.id, name: 'Accountant', code: 'ACCOUNTANT', description: 'Finance and billing clerk', isSystem: true },
        { schoolId: school.id, name: 'Student', code: 'STUDENT', description: 'Enrolled learner portal', isSystem: true },
        { schoolId: school.id, name: 'Parent', code: 'PARENT', description: 'Guardian portal', isSystem: true },
      ],
    });

    // 5. Create Default Departments
    await prisma.department.createMany({
      data: [
        { schoolId: school.id, name: 'Administration', code: 'DEPT-ADMIN', description: 'Central School Operations' },
        { schoolId: school.id, name: 'Academics', code: 'DEPT-ACAD', description: 'Teaching Faculty' },
        { schoolId: school.id, name: 'Finance', code: 'DEPT-FIN', description: 'Accounts & Fees' },
      ],
    });

    // 6. Create School Owner User
    const passwordHash = await hashPassword(ownerPassword);
    const ownerUser = await prisma.user.create({
      data: {
        email: ownerEmail.toLowerCase().trim(),
        passwordHash,
        firstName: ownerFirstName || 'School',
        lastName: ownerLastName || 'Owner',
        schoolId: school.id,
        status: 'ACTIVE',
      },
    });

    await prisma.userRole.create({
      data: {
        userId: ownerUser.id,
        roleId: roleOwner.id,
      },
    });

    await logAuditTrail({
      schoolId: school.id,
      actorId: user.id,
      action: 'SCHOOL_CREATED',
      resource: `School ${school.name} (${school.code})`,
      newValue: { schoolId: school.id, ownerEmail },
    });

    return NextResponse.json({
      success: true,
      data: {
        school,
        owner: { id: ownerUser.id, email: ownerUser.email },
      },
    });
  } catch (error: any) {
    console.error('Error creating school:', error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
