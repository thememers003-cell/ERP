const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Customizable Leave Types and Teacher Allocations...');

  const school = await prisma.school.findFirst();
  if (!school) {
    console.error('No school found!');
    return;
  }

  // 1. Create Customizable Leave Types
  const leaveTypesData = [
    { name: 'Casual Leave', code: 'CASUAL', defaultDays: 4, description: 'Short-term personal & urgent affairs' },
    { name: 'Paid Leave', code: 'PAID', defaultDays: 4, description: 'Statutory paid annual personal leave' },
    { name: 'Medical / Sick Leave', code: 'SICK', defaultDays: 6, description: 'Medical recovery & health absence' },
    { name: 'Duty / Academic Leave', code: 'DUTY', defaultDays: 3, description: 'External examination invigilation or conference' },
  ];

  const createdTypes = [];
  for (const lt of leaveTypesData) {
    const type = await prisma.leaveType.upsert({
      where: { schoolId_code: { schoolId: school.id, code: lt.code } },
      update: lt,
      create: { ...lt, schoolId: school.id },
    });
    createdTypes.push(type);
    console.log(`✓ Leave Type: ${type.name} (${type.code}) - ${type.defaultDays} days default`);
  }

  // 2. Assign Leave Quotas to All Faculty Members
  const teachers = await prisma.teacher.findMany({
    where: { schoolId: school.id },
  });

  for (const t of teachers) {
    for (const lt of createdTypes) {
      await prisma.teacherLeaveBalance.upsert({
        where: { teacherId_leaveTypeId: { teacherId: t.id, leaveTypeId: lt.id } },
        update: {},
        create: {
          schoolId: school.id,
          teacherId: t.id,
          leaveTypeId: lt.id,
          allocatedDays: lt.defaultDays,
          usedDays: 0,
        },
      });
    }
    console.log(`✓ Initialized customizable leave balances for Teacher ${t.employeeCode}`);
  }

  console.log('✅ Leave Types and Balances initialized successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
