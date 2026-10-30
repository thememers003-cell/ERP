const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting NexEdu ERP Database Seeding...');

  // 1. Create Global Platform Plans
  const plans = [
    {
      name: 'Starter Institution',
      code: 'STARTER',
      description: 'Ideal for small schools and coaching centers',
      monthlyPrice: 99,
      maxStudents: 300,
      maxTeachers: 25,
      maxStorageGb: 10,
      enabledModules: JSON.stringify(['core_academics', 'students', 'teachers', 'attendance', 'homework']),
    },
    {
      name: 'Professional K-12',
      code: 'PRO',
      description: 'Full-featured package for modern international schools',
      monthlyPrice: 249,
      maxStudents: 1500,
      maxTeachers: 100,
      maxStorageGb: 50,
      enabledModules: JSON.stringify([
        'core_academics',
        'departments',
        'students',
        'teachers',
        'attendance',
        'homework',
        'examinations',
        'fees_billing',
        'communication',
      ]),
    },
    {
      name: 'Enterprise Campus',
      code: 'ENTERPRISE',
      description: 'Unlimited institutional scale with AI & Multi-branch support',
      monthlyPrice: 499,
      maxStudents: 5000,
      maxTeachers: 350,
      maxStorageGb: 250,
      enabledModules: JSON.stringify([
        'core_academics',
        'departments',
        'students',
        'teachers',
        'attendance',
        'homework',
        'examinations',
        'fees_billing',
        'hr_payroll',
        'communication',
        'ai_assistant',
      ]),
    },
  ];

  for (const p of plans) {
    await prisma.platformPlan.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
  }

  // 2. Global Catalog of Permissions
  const permissionsData = [
    // Students
    { moduleKey: 'students', action: 'VIEW', name: 'View Students', description: 'Browse and view student profiles' },
    { moduleKey: 'students', action: 'CREATE', name: 'Enroll Student', description: 'Register new students' },
    { moduleKey: 'students', action: 'EDIT', name: 'Edit Student', description: 'Update student profiles and records' },
    { moduleKey: 'students', action: 'DELETE', name: 'Delete Student', description: 'Archive or remove students' },
    { moduleKey: 'students', action: 'EXPORT', name: 'Export Students', description: 'Export student lists to CSV/Excel' },
    // Teachers & Staff
    { moduleKey: 'teachers', action: 'VIEW', name: 'View Staff', description: 'View staff directory' },
    { moduleKey: 'teachers', action: 'CREATE', name: 'Add Staff', description: 'Onboard new faculty and staff' },
    { moduleKey: 'teachers', action: 'EDIT', name: 'Edit Staff', description: 'Modify staff details' },
    { moduleKey: 'teachers', action: 'DELETE', name: 'Delete Staff', description: 'Deactivate staff accounts' },
    // Attendance
    { moduleKey: 'attendance', action: 'VIEW', name: 'View Attendance', description: 'View attendance registers' },
    { moduleKey: 'attendance', action: 'MARK', name: 'Mark Attendance', description: 'Conduct roll-call attendance' },
    { moduleKey: 'attendance', action: 'EDIT', name: 'Edit Attendance', description: 'Alter past attendance records' },
    { moduleKey: 'attendance', action: 'EXPORT', name: 'Export Attendance', description: 'Download attendance reports' },
    // Homework
    { moduleKey: 'homework', action: 'VIEW', name: 'View Homework', description: 'View assigned homework' },
    { moduleKey: 'homework', action: 'CREATE', name: 'Create Homework', description: 'Assign homework and deadlines' },
    { moduleKey: 'homework', action: 'EDIT', name: 'Edit Homework', description: 'Update assignment instructions' },
    { moduleKey: 'homework', action: 'EVALUATE', name: 'Evaluate Homework', description: 'Grade student submissions' },
    // Exams & Marks
    { moduleKey: 'examinations', action: 'VIEW', name: 'View Exams', description: 'View exams and schedules' },
    { moduleKey: 'examinations', action: 'CREATE', name: 'Create Exam', description: 'Schedule new examinations' },
    { moduleKey: 'examinations', action: 'ENTER_MARKS', name: 'Enter Marks', description: 'Input student exam scores' },
    { moduleKey: 'examinations', action: 'PUBLISH', name: 'Publish Results', description: 'Publish report cards and results' },
    // Fees
    { moduleKey: 'fees_billing', action: 'VIEW', name: 'View Invoices', description: 'View fee ledger and bills' },
    { moduleKey: 'fees_billing', action: 'CREATE', name: 'Generate Invoices', description: 'Issue fee structures & invoices' },
    { moduleKey: 'fees_billing', action: 'COLLECT', name: 'Collect Payments', description: 'Accept payments and print receipts' },
    // Settings & Roles
    { moduleKey: 'settings', action: 'VIEW', name: 'View Settings', description: 'Access school configuration' },
    { moduleKey: 'settings', action: 'EDIT_ROLES', name: 'Manage Roles', description: 'Create and edit custom roles' },
    { moduleKey: 'settings', action: 'EDIT_MODULES', name: 'Toggle Modules', description: 'Enable/disable ERP modules' },
    { moduleKey: 'settings', action: 'EDIT_BRANDING', name: 'Customize Brand', description: 'Update logos and school colors' },
  ];

  for (const perm of permissionsData) {
    await prisma.permission.upsert({
      where: { moduleKey_action: { moduleKey: perm.moduleKey, action: perm.action } },
      update: perm,
      create: perm,
    });
  }

  // 3. Platform Super Admin User
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@nexedu.com' },
    update: {
      passwordHash: adminPasswordHash,
      isSuperAdmin: true,
      status: 'ACTIVE',
    },
    create: {
      email: 'superadmin@nexedu.com',
      passwordHash: adminPasswordHash,
      firstName: 'Alexander',
      lastName: 'Vance',
      isSuperAdmin: true,
      status: 'ACTIVE',
    },
  });
  console.log(`✓ Super Admin created: ${superAdmin.email}`);

  // 4. Create Showcase School: Green Valley International School
  const proPlan = await prisma.platformPlan.findUnique({ where: { code: 'PRO' } });

  const school = await prisma.school.upsert({
    where: { code: 'GVIS' },
    update: {
      name: 'Green Valley International School',
      slug: 'green-valley',
      logoUrl: '/logos/green-valley.svg',
      primaryColor: '#1d4ed8', // Royal Blue
      accentColor: '#059669',  // Emerald Green
      schoolType: 'K12',
      address: '742 Evergreen Academic Boulevard',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      phone: '+91 80 4123 4567',
      email: 'admissions@greenvalley.edu',
      status: 'ACTIVE',
      planId: proPlan ? proPlan.id : null,
    },
    create: {
      name: 'Green Valley International School',
      code: 'GVIS',
      slug: 'green-valley',
      logoUrl: '/logos/green-valley.svg',
      primaryColor: '#1d4ed8',
      accentColor: '#059669',
      schoolType: 'K12',
      address: '742 Evergreen Academic Boulevard',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      phone: '+91 80 4123 4567',
      email: 'admissions@greenvalley.edu',
      status: 'ACTIVE',
      planId: proPlan ? proPlan.id : null,
    },
  });
  console.log(`✓ Showcase School: ${school.name} (${school.code})`);

  // 5. Enable Modules for School
  const activeModuleKeys = [
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

  for (const modKey of activeModuleKeys) {
    await prisma.schoolModule.upsert({
      where: { schoolId_moduleKey: { schoolId: school.id, moduleKey: modKey } },
      update: { isEnabled: true },
      create: { schoolId: school.id, moduleKey: modKey, isEnabled: true },
    });
  }

  // 6. Academic Year
  const academicYear = await prisma.academicYear.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'AY-2026-27' } },
    update: { isCurrent: true },
    create: {
      schoolId: school.id,
      name: 'Academic Year 2026-2027',
      code: 'AY-2026-27',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-04-30'),
      isCurrent: true,
    },
  });

  await prisma.school.update({
    where: { id: school.id },
    data: { currentYearId: academicYear.id },
  });

  // 7. Departments
  const departmentsData = [
    { name: 'Mathematics', code: 'DEPT-MATH', description: 'Pure & Applied Mathematics' },
    { name: 'Science & Robotics', code: 'DEPT-SCI', description: 'Physics, Chemistry, Biology & STEM Labs' },
    { name: 'English & Humanities', code: 'DEPT-ENG', description: 'Language Arts, World History & Social Studies' },
    { name: 'Administration', code: 'DEPT-ADMIN', description: 'Central School Operations & Registrar' },
    { name: 'Finance & Accounts', code: 'DEPT-FIN', description: 'Student Billing, Payroll & Procurement' },
  ];

  const createdDepts = {};
  for (const dept of departmentsData) {
    const d = await prisma.department.upsert({
      where: { schoolId_code: { schoolId: school.id, code: dept.code } },
      update: dept,
      create: { ...dept, schoolId: school.id },
    });
    createdDepts[dept.code] = d;
  }

  // 8. Dynamic Roles & Granular Permissions
  const allPermissions = await prisma.permission.findMany();

  // Helper to create role with permissions
  async function setupRole(name, code, description, isSystem, deptId, grantedFilter) {
    const role = await prisma.role.upsert({
      where: { schoolId_code: { schoolId: school.id, code } },
      update: { name, description, departmentId: deptId, isSystem },
      create: { schoolId: school.id, name, code, description, departmentId: deptId, isSystem },
    });

    for (const p of allPermissions) {
      const isGranted = grantedFilter(p);
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
        update: { granted: isGranted },
        create: { roleId: role.id, permissionId: p.id, granted: isGranted },
      });
    }
    return role;
  }

  // Roles:
  // 1. School Owner (all permissions)
  const roleOwner = await setupRole('School Owner', 'SCHOOL_OWNER', 'Complete ownership and institutional control', true, null, () => true);

  // 2. Principal (academic & viewing oversight, settings view)
  const rolePrincipal = await setupRole('Principal', 'PRINCIPAL', 'Head of School with comprehensive academic and student oversight', true, createdDepts['DEPT-ADMIN'].id, (p) => {
    return p.action === 'VIEW' || p.action === 'APPROVE' || p.action === 'PUBLISH';
  });

  // 3. Subject Teacher (views students, marks attendance, assigns homework, enters marks)
  const roleSubjectTeacher = await setupRole('Subject Teacher', 'SUBJECT_TEACHER', 'Classroom teaching faculty', true, createdDepts['DEPT-MATH'].id, (p) => {
    if (p.moduleKey === 'students' && p.action === 'VIEW') return true;
    if (p.moduleKey === 'attendance' && (p.action === 'VIEW' || p.action === 'MARK')) return true;
    if (p.moduleKey === 'homework') return true;
    if (p.moduleKey === 'examinations' && (p.action === 'VIEW' || p.action === 'ENTER_MARKS')) return true;
    return false;
  });

  // 4. Custom Role: "Junior Maths Teacher" (as requested in specifications!)
  const roleJuniorMathTeacher = await setupRole(
    'Junior Maths Teacher',
    'JUNIOR_MATH_TEACHER',
    'Faculty specializing in Grade 6-8 Mathematics with homework and attendance authority',
    false,
    createdDepts['DEPT-MATH'].id,
    (p) => {
      if (p.moduleKey === 'students' && p.action === 'VIEW') return true;
      if (p.moduleKey === 'attendance' && (p.action === 'VIEW' || p.action === 'MARK')) return true;
      if (p.moduleKey === 'homework' && ['VIEW', 'CREATE', 'EDIT', 'EVALUATE'].includes(p.action)) return true;
      if (p.moduleKey === 'examinations' && ['VIEW', 'ENTER_MARKS'].includes(p.action)) return true;
      return false; // Zero access to Fees, Payroll, or System Settings
    }
  );

  // 5. Accountant
  const roleAccountant = await setupRole('Accountant', 'ACCOUNTANT', 'Institutional bursar and finance officer', true, createdDepts['DEPT-FIN'].id, (p) => {
    if (p.moduleKey === 'fees_billing') return true;
    if (p.moduleKey === 'students' && p.action === 'VIEW') return true;
    return false;
  });

  // 6. Student
  const roleStudent = await setupRole('Student', 'STUDENT', 'Self-service portal access for enrolled learners', true, null, (p) => {
    return p.action === 'VIEW' && ['attendance', 'homework', 'examinations'].includes(p.moduleKey);
  });

  // 7. Parent
  const roleParent = await setupRole('Parent', 'PARENT', 'Guardian portal access to track wards', true, null, (p) => {
    return p.action === 'VIEW' && ['attendance', 'homework', 'examinations', 'fees_billing'].includes(p.moduleKey);
  });

  console.log('✓ Dynamic Roles & Permission Matrices configured');

  // 9. Classes & Sections
  const classesData = [
    { name: 'Grade 8', code: 'G8', numericLevel: 8 },
    { name: 'Grade 9', code: 'G9', numericLevel: 9 },
    { name: 'Grade 10', code: 'G10', numericLevel: 10 },
  ];

  const createdClasses = {};
  for (const c of classesData) {
    const classObj = await prisma.classGrade.upsert({
      where: { schoolId_academicYearId_code: { schoolId: school.id, academicYearId: academicYear.id, code: c.code } },
      update: c,
      create: { ...c, schoolId: school.id, academicYearId: academicYear.id },
    });
    createdClasses[c.code] = classObj;
  }

  // Sections
  const sectionsData = [
    { classCode: 'G8', name: 'Section 8-A', roomNumber: 'Room 201' },
    { classCode: 'G8', name: 'Section 8-B', roomNumber: 'Room 202' },
    { classCode: 'G9', name: 'Section 9-A', roomNumber: 'Room 301' },
    { classCode: 'G10', name: 'Section 10-A', roomNumber: 'Room 401' },
  ];

  const createdSections = {};
  for (const s of sectionsData) {
    const classObj = createdClasses[s.classCode];
    const sec = await prisma.section.upsert({
      where: { schoolId_classId_name: { schoolId: school.id, classId: classObj.id, name: s.name } },
      update: { roomNumber: s.roomNumber },
      create: { schoolId: school.id, classId: classObj.id, name: s.name, roomNumber: s.roomNumber },
    });
    createdSections[s.name] = sec;
  }

  // 10. Subjects
  const subjectsData = [
    { name: 'Mathematics', code: 'MATH-101', type: 'THEORY' },
    { name: 'Physics & Lab', code: 'PHY-101', type: 'PRACTICAL' },
    { name: 'Chemistry', code: 'CHEM-101', type: 'THEORY' },
    { name: 'English Literature', code: 'ENG-101', type: 'THEORY' },
    { name: 'Computer Science', code: 'CS-101', type: 'PRACTICAL' },
  ];

  const createdSubjects = {};
  for (const sub of subjectsData) {
    const s = await prisma.subject.upsert({
      where: { schoolId_code: { schoolId: school.id, code: sub.code } },
      update: sub,
      create: { ...sub, schoolId: school.id },
    });
    createdSubjects[sub.code] = s;
  }

  // 11. Create Users & Profiles
  const defaultPassword = await bcrypt.hash('password123', 10);

  // Helper to create user + userRole
  async function createUser(email, firstName, lastName, role, phone, avatarUrl) {
    const u = await prisma.user.upsert({
      where: { email },
      update: { firstName, lastName, phone, schoolId: school.id, status: 'ACTIVE', avatarUrl },
      create: {
        email,
        passwordHash: defaultPassword,
        firstName,
        lastName,
        phone,
        schoolId: school.id,
        status: 'ACTIVE',
        avatarUrl,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: u.id, roleId: role.id } },
      update: {},
      create: { userId: u.id, roleId: role.id },
    });
    return u;
  }

  // School Owner
  const ownerUser = await createUser('owner@greenvalley.edu', 'Vikramaditya', 'Singhania', roleOwner, '+91 98765 43210');

  // Principal
  const principalUser = await createUser('principal@greenvalley.edu', 'Dr. Evelyn', 'Reed', rolePrincipal, '+91 98765 11223');

  // Senior Teacher (Dr. Rajesh Sharma, HOD Math)
  const teacherUser1 = await createUser('dr.sharma@greenvalley.edu', 'Rajesh', 'Sharma', roleSubjectTeacher, '+91 98765 22334');
  const teacherProfile1 = await prisma.teacher.upsert({
    where: { schoolId_employeeCode: { schoolId: school.id, employeeCode: 'FAC-001' } },
    update: { designation: 'Head of Mathematics', departmentId: createdDepts['DEPT-MATH'].id },
    create: {
      userId: teacherUser1.id,
      schoolId: school.id,
      employeeCode: 'FAC-001',
      designation: 'Head of Mathematics',
      departmentId: createdDepts['DEPT-MATH'].id,
      qualification: 'Ph.D. in Applied Mathematics',
    },
  });

  // Update HOD of Mathematics department
  await prisma.department.update({
    where: { id: createdDepts['DEPT-MATH'].id },
    data: { hodUserId: teacherUser1.id },
  });

  // Assign class teacher to Section 8-A
  await prisma.section.update({
    where: { id: createdSections['Section 8-A'].id },
    data: { classTeacherId: teacherProfile1.id },
  });

  // Junior Maths Teacher (Rahul Verma) with scoped permissions to Grade 8 Mathematics!
  const teacherUser2 = await createUser('rahul.verma@greenvalley.edu', 'Rahul', 'Verma', roleJuniorMathTeacher, '+91 98765 33445');
  const teacherProfile2 = await prisma.teacher.upsert({
    where: { schoolId_employeeCode: { schoolId: school.id, employeeCode: 'FAC-002' } },
    update: { designation: 'Junior Mathematics Teacher', departmentId: createdDepts['DEPT-MATH'].id },
    create: {
      userId: teacherUser2.id,
      schoolId: school.id,
      employeeCode: 'FAC-002',
      designation: 'Junior Mathematics Teacher',
      departmentId: createdDepts['DEPT-MATH'].id,
      qualification: 'M.Sc. Mathematics, B.Ed.',
    },
  });

  // Assign Scope to Rahul Verma: Class 8 Mathematics only!
  await prisma.userPermissionScope.deleteMany({
    where: { userId: teacherUser2.id },
  });
  await prisma.userPermissionScope.createMany({
    data: [
      {
        userId: teacherUser2.id,
        classId: createdClasses['G8'].id,
        subjectId: createdSubjects['MATH-101'].id,
      },
    ],
  });

  // Link class subjects
  await prisma.classSubject.upsert({
    where: {
      classId_sectionId_subjectId: {
        classId: createdClasses['G8'].id,
        sectionId: createdSections['Section 8-A'].id,
        subjectId: createdSubjects['MATH-101'].id,
      },
    },
    update: { teacherId: teacherProfile2.id },
    create: {
      classId: createdClasses['G8'].id,
      sectionId: createdSections['Section 8-A'].id,
      subjectId: createdSubjects['MATH-101'].id,
      teacherId: teacherProfile2.id,
    },
  });

  // Accountant
  const accountantUser = await createUser('accountant@greenvalley.edu', 'Mahesh', 'Kulkarni', roleAccountant, '+91 98765 55667');

  // 12. Students
  const studentsList = [
    {
      email: 'aarav.patel@student.greenvalley.edu',
      first: 'Aarav',
      last: 'Patel',
      admNo: 'GVIS-2026-001',
      roll: '01',
      gender: 'MALE',
      blood: 'O+',
      sec: 'Section 8-A',
      cls: 'G8',
    },
    {
      email: 'diya.sharma@student.greenvalley.edu',
      first: 'Diya',
      last: 'Sharma',
      admNo: 'GVIS-2026-002',
      roll: '02',
      gender: 'FEMALE',
      blood: 'A+',
      sec: 'Section 8-A',
      cls: 'G8',
    },
    {
      email: 'rohan.gupta@student.greenvalley.edu',
      first: 'Rohan',
      last: 'Gupta',
      admNo: 'GVIS-2026-003',
      roll: '01',
      gender: 'MALE',
      blood: 'B+',
      sec: 'Section 8-B',
      cls: 'G8',
    },
    {
      email: 'ananya.iyer@student.greenvalley.edu',
      first: 'Ananya',
      last: 'Iyer',
      admNo: 'GVIS-2026-004',
      roll: '01',
      gender: 'FEMALE',
      blood: 'AB+',
      sec: 'Section 9-A',
      cls: 'G9',
    },
  ];

  const createdStudents = [];
  for (const s of studentsList) {
    const userObj = await createUser(s.email, s.first, s.last, roleStudent, '+91 99000 11000');
    const stu = await prisma.student.upsert({
      where: { schoolId_admissionNumber: { schoolId: school.id, admissionNumber: s.admNo } },
      update: {
        rollNumber: s.roll,
        gender: s.gender,
        bloodGroup: s.blood,
        classId: createdClasses[s.cls].id,
        sectionId: createdSections[s.sec].id,
        academicYearId: academicYear.id,
      },
      create: {
        userId: userObj.id,
        schoolId: school.id,
        admissionNumber: s.admNo,
        rollNumber: s.roll,
        gender: s.gender,
        bloodGroup: s.blood,
        classId: createdClasses[s.cls].id,
        sectionId: createdSections[s.sec].id,
        academicYearId: academicYear.id,
      },
    });
    createdStudents.push(stu);
  }

  // 13. Parent
  const parentUser = await createUser('vikram.patel@gmail.com', 'Vikram', 'Patel', roleParent, '+91 98888 77777');
  const parentProfile = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: { occupation: 'Software Engineering Director', relationship: 'FATHER' },
    create: {
      userId: parentUser.id,
      schoolId: school.id,
      occupation: 'Software Engineering Director',
      relationship: 'FATHER',
    },
  });

  // Link Parent to Aarav Patel
  await prisma.parentStudent.upsert({
    where: { parentId_studentId: { parentId: parentProfile.id, studentId: createdStudents[0].id } },
    update: { isPrimaryContact: true },
    create: { parentId: parentProfile.id, studentId: createdStudents[0].id, isPrimaryContact: true },
  });

  // 14. Attendance Records for Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendanceStatuses = ['PRESENT', 'PRESENT', 'LATE', 'PRESENT'];
  for (let i = 0; i < createdStudents.length; i++) {
    const stu = createdStudents[i];
    await prisma.attendanceRecord.upsert({
      where: { schoolId_studentId_date: { schoolId: school.id, studentId: stu.id, date: today } },
      update: { status: attendanceStatuses[i] },
      create: {
        schoolId: school.id,
        studentId: stu.id,
        sectionId: stu.sectionId,
        date: today,
        status: attendanceStatuses[i],
        markedById: teacherUser2.id,
      },
    });
  }

  // 15. Homework
  let homework1 = await prisma.homework.findFirst({
    where: {
      schoolId: school.id,
      sectionId: createdSections['Section 8-A'].id,
      title: 'Linear Equations in Two Variables - Problem Set 3',
    },
  });
  if (!homework1) {
    homework1 = await prisma.homework.create({
      data: {
        schoolId: school.id,
        sectionId: createdSections['Section 8-A'].id,
        subjectId: createdSubjects['MATH-101'].id,
        teacherId: teacherProfile2.id,
        title: 'Linear Equations in Two Variables - Problem Set 3',
        description: 'Solve textbook exercises 3.1 to 3.4 on graph plotting and simultaneous elimination method.',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        maxMarks: 50,
        status: 'PUBLISHED',
      },
    });
  }

  // 16. Examination & Marks
  let exam = await prisma.exam.findFirst({
    where: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: 'Term 1 Mid-Year Examination 2026',
    },
  });
  if (!exam) {
    exam = await prisma.exam.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        name: 'Term 1 Mid-Year Examination 2026',
        type: 'MID_TERM',
        startDate: new Date('2026-09-15'),
        endDate: new Date('2026-09-28'),
        status: 'COMPLETED',
      },
    });
  }

  const examSched = await prisma.examSchedule.upsert({
    where: {
      examId_subjectId: {
        examId: exam.id,
        subjectId: createdSubjects['MATH-101'].id,
      },
    },
    update: {},
    create: {
      examId: exam.id,
      subjectId: createdSubjects['MATH-101'].id,
      date: new Date('2026-09-18'),
      maxMarks: 100,
      passingMarks: 40,
    },
  });

  await prisma.mark.upsert({
    where: {
      examScheduleId_studentId: {
        examScheduleId: examSched.id,
        studentId: createdStudents[0].id,
      },
    },
    update: {
      marksObtained: 94,
      grade: 'A*',
      remarks: 'Outstanding analytical capability and precision in geometry.',
    },
    create: {
      examScheduleId: examSched.id,
      studentId: createdStudents[0].id,
      marksObtained: 94,
      grade: 'A*',
      remarks: 'Outstanding analytical capability and precision in geometry.',
    },
  });

  await prisma.mark.upsert({
    where: {
      examScheduleId_studentId: {
        examScheduleId: examSched.id,
        studentId: createdStudents[1].id,
      },
    },
    update: {
      marksObtained: 88,
      grade: 'A',
      remarks: 'Strong concept grasp, minor calculation slip in question 4.',
    },
    create: {
      examScheduleId: examSched.id,
      studentId: createdStudents[1].id,
      marksObtained: 88,
      grade: 'A',
      remarks: 'Strong concept grasp, minor calculation slip in question 4.',
    },
  });

  // 17. Fee Structure & Invoice
  let feeStructure = await prisma.feeStructure.findFirst({
    where: {
      schoolId: school.id,
      code: 'FEE-G8-Q2',
    },
  });
  if (!feeStructure) {
    feeStructure = await prisma.feeStructure.create({
      data: {
        schoolId: school.id,
        classId: createdClasses['G8'].id,
        name: 'Quarterly Academic Tuition Fee (Q2)',
        code: 'FEE-G8-Q2',
        amount: 45000,
        frequency: 'QUARTERLY',
      },
    });
  }

  const invoice = await prisma.invoice.upsert({
    where: {
      schoolId_invoiceNumber: {
        schoolId: school.id,
        invoiceNumber: 'INV-2026-0801',
      },
    },
    update: {
      totalAmount: 45000,
      paidAmount: 45000,
      balance: 0,
      status: 'PAID',
    },
    create: {
      schoolId: school.id,
      studentId: createdStudents[0].id,
      invoiceNumber: 'INV-2026-0801',
      title: 'Quarter 2 Comprehensive Tuition & Activity Fee',
      totalAmount: 45000,
      paidAmount: 45000,
      balance: 0,
      status: 'PAID',
      dueDate: new Date('2026-09-30'),
    },
  });

  await prisma.paymentReceipt.upsert({
    where: {
      schoolId_receiptNumber: {
        schoolId: school.id,
        receiptNumber: 'REC-2026-0419',
      },
    },
    update: {
      amount: 45000,
      paymentMethod: 'UPI',
      transactionRef: 'UPI-AXIS-9928174621',
    },
    create: {
      schoolId: school.id,
      invoiceId: invoice.id,
      receiptNumber: 'REC-2026-0419',
      amount: 45000,
      paymentMethod: 'UPI',
      transactionRef: 'UPI-AXIS-9928174621',
    },
  });

  // 18. Leave Types and Teacher Allocations
  const leaveTypesData = [
    { name: 'Casual Leave', code: 'CASUAL', defaultDays: 4, description: 'Short-term personal & urgent affairs' },
    { name: 'Paid Leave', code: 'PAID', defaultDays: 4, description: 'Statutory paid annual personal leave' },
    { name: 'Medical / Sick Leave', code: 'SICK', defaultDays: 6, description: 'Medical recovery & health absence' },
    { name: 'Duty / Academic Leave', code: 'DUTY', defaultDays: 3, description: 'External examination invigilation or conference' },
  ];

  const createdLeaveTypes = [];
  for (const lt of leaveTypesData) {
    const type = await prisma.leaveType.upsert({
      where: { schoolId_code: { schoolId: school.id, code: lt.code } },
      update: lt,
      create: { ...lt, schoolId: school.id },
    });
    createdLeaveTypes.push(type);
  }

  const allTeachers = await prisma.teacher.findMany({ where: { schoolId: school.id } });
  for (const t of allTeachers) {
    for (const lt of createdLeaveTypes) {
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
  }

  // 19. Audit Log record
  await prisma.auditLog.create({
    data: {
      schoolId: school.id,
      actorId: ownerUser.id,
      action: 'SYSTEM_INITIALIZED',
      resource: 'Institution #GVIS',
      newValue: JSON.stringify({ schoolName: school.name, academicYear: academicYear.name }),
    },
  });

  console.log('✅ NexEdu ERP database successfully seeded with demo institution!');
  console.log('-------------------------------------------------------------');
  console.log('DEMO ACCOUNTS READY FOR IMMEDIATE LOGIN:');
  console.log('Super Admin:     superadmin@nexedu.com      | admin123');
  console.log('School Owner:    owner@greenvalley.edu      | password123');
  console.log('Principal:       principal@greenvalley.edu  | password123');
  console.log('Maths HOD:       dr.sharma@greenvalley.edu  | password123');
  console.log('Junior Teacher:  rahul.verma@greenvalley.edu| password123 (Custom Role + Scoped)');
  console.log('Accountant:      accountant@greenvalley.edu | password123');
  console.log('Parent:          vikram.patel@gmail.com     | password123');
  console.log('Student:         aarav.patel@student.greenvalley.edu | password123');
  console.log('-------------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
