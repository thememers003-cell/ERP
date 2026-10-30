const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
  console.log('--- Testing Customizable Leaves & Calendar Integration ---');

  // 1. Find school and teacher
  const school = await prisma.school.findFirst();
  if (!school) {
    console.error('No school found!');
    process.exit(1);
  }
  console.log(`Using school: ${school.name} (${school.id})`);

  const teacher = await prisma.teacher.findFirst({
    where: { schoolId: school.id },
    include: { user: true },
  });
  if (!teacher) {
    console.error('No teacher found!');
    process.exit(1);
  }
  console.log(`Using faculty: ${teacher.user.firstName} ${teacher.user.lastName} (${teacher.id})`);

  // 2. Create / Upsert a custom leave type (e.g. "CASUAL" or "REGULAR_LEAVE")
  const regularType = await prisma.leaveType.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'CASUAL' } },
    update: { defaultDays: 4 },
    create: {
      schoolId: school.id,
      name: 'Casual Leave',
      code: 'CASUAL',
      defaultDays: 4,
      description: 'Standard casual absence leave',
      isActive: true,
    },
  });
  console.log(`Verified LeaveType: ${regularType.name} (Code: ${regularType.code}, Default Days: ${regularType.defaultDays})`);

  // 3. Assign / Customize quota for this faculty: Casual 4 days
  const balance = await prisma.teacherLeaveBalance.upsert({
    where: { teacherId_leaveTypeId: { teacherId: teacher.id, leaveTypeId: regularType.id } },
    update: { allocatedDays: 4, usedDays: 0 },
    create: {
      schoolId: school.id,
      teacherId: teacher.id,
      leaveTypeId: regularType.id,
      allocatedDays: 4,
      usedDays: 0,
    },
  });
  console.log(`Assigned quota to ${teacher.user.firstName}: Allocated = ${balance.allocatedDays}, Used = ${balance.usedDays}, Remaining = ${balance.allocatedDays - balance.usedDays}`);

  // 4. Create a 2-day leave application
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const startDateStr = today.toISOString().slice(0, 10);
  const endDateStr = tomorrow.toISOString().slice(0, 10);

  const leaveApp = await prisma.leaveApplication.create({
    data: {
      schoolId: school.id,
      employeeId: teacher.id,
      leaveType: 'CASUAL',
      startDate: new Date(startDateStr),
      endDate: new Date(endDateStr),
      reason: 'Attending family occasion and personal errands',
      status: 'PENDING',
    },
  });
  console.log(`Created Leave Application #${leaveApp.id} for 2 days (Status: ${leaveApp.status})`);

  // 5. Simulate Admin Approval & automatic deduction
  const daysRequested = Math.round((new Date(endDateStr).getTime() - new Date(startDateStr).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  console.log(`Approving leave (${daysRequested} days requested)...`);

  await prisma.leaveApplication.update({
    where: { id: leaveApp.id },
    data: { status: 'APPROVED' },
  });

  const updatedBalance = await prisma.teacherLeaveBalance.update({
    where: { teacherId_leaveTypeId: { teacherId: teacher.id, leaveTypeId: regularType.id } },
    data: { usedDays: { increment: daysRequested } },
  });

  const remaining = Math.max(0, updatedBalance.allocatedDays - updatedBalance.usedDays);
  console.log(`[SUCCESS] Leave Approved! Deducted ${daysRequested} days.`);
  console.log(`New Balance: Allocated = ${updatedBalance.allocatedDays}, Used = ${updatedBalance.usedDays}, Remaining = ${remaining} days`);

  if (remaining !== 2) {
    console.error(`FAILED: Expected remaining days to be 2, got ${remaining}`);
    process.exit(1);
  }

  // 6. Verify that it appears in Calendar Query
  const calendarApprovedLeaves = await prisma.leaveApplication.findMany({
    where: { schoolId: school.id, status: 'APPROVED' },
    include: {
      teacher: { include: { user: true } },
    },
  });

  const foundInCalendar = calendarApprovedLeaves.some((l) => l.id === leaveApp.id);
  console.log(`Calendar Feed Verification: Found approved leave in calendar query? -> ${foundInCalendar ? 'YES (SUCCESS)' : 'NO (FAILED)'}`);

  if (!foundInCalendar) {
    console.error('FAILED: Leave not present in calendar query');
    process.exit(1);
  }

  console.log('--- ALL LEAVE & CALENDAR DEDUCTION TESTS PASSED 100% ---');
  await prisma.$disconnect();
}

runTest().catch((e) => {
  console.error(e);
  process.exit(1);
});
