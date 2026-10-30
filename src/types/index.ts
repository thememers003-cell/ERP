export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'INVITED';
export type SchoolStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'ARCHIVED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'EXCUSED';
export type ExamType = 'UNIT_TEST' | 'MID_TERM' | 'FINAL' | 'INTERNAL';
export type InvoiceStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
export type LeaveStatus = 'PENDING' | 'APPROVED_HOD' | 'APPROVED' | 'REJECTED';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  isSuperAdmin: boolean;
  schoolId: string | null;
  schoolName?: string | null;
  schoolCode?: string | null;
  schoolLogo?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  roles: string[];
  permissions: {
    module: string;
    action: string;
  }[];
  enabledModules: string[];
  scopes: {
    classId?: string | null;
    sectionId?: string | null;
    subjectId?: string | null;
    departmentId?: string | null;
  }[];
}

export interface ModuleDefinition {
  key: string;
  name: string;
  category: 'Academics' | 'People' | 'Operations' | 'Finance' | 'Intelligence';
  description: string;
  icon: string;
  isCore: boolean;
  defaultEnabled: boolean;
}

export const SYSTEM_MODULES: ModuleDefinition[] = [
  {
    key: 'core_academics',
    name: 'Academic Structure',
    category: 'Academics',
    description: 'Academic years, classes, sections, classrooms, and course curriculum',
    icon: 'GraduationCap',
    isCore: true,
    defaultEnabled: true,
  },
  {
    key: 'departments',
    name: 'Departments',
    category: 'Academics',
    description: 'Academic and administrative departments, HOD assignments, and member allocation',
    icon: 'Building2',
    isCore: true,
    defaultEnabled: true,
  },
  {
    key: 'students',
    name: 'Student Management',
    category: 'People',
    description: 'Student admissions, 360 profiles, enrollment records, and emergency contacts',
    icon: 'Users',
    isCore: true,
    defaultEnabled: true,
  },
  {
    key: 'teachers',
    name: 'Teacher & Staff',
    category: 'People',
    description: 'Faculty directory, employee codes, designations, qualifications, and department allocations',
    icon: 'UserCheck',
    isCore: true,
    defaultEnabled: true,
  },
  {
    key: 'attendance',
    name: 'Attendance Register',
    category: 'Operations',
    description: 'Daily student roll call, monthly reports, percentage tracking, and absenteeism alerts',
    icon: 'CalendarCheck',
    isCore: false,
    defaultEnabled: true,
  },
  {
    key: 'homework',
    name: 'Homework & Assignments',
    category: 'Academics',
    description: 'Assignments publishing, digital submissions, teacher evaluation, and grading',
    icon: 'FileText',
    isCore: false,
    defaultEnabled: true,
  },
  {
    key: 'examinations',
    name: 'Exams & Gradebook',
    category: 'Academics',
    description: 'Examination datesheets, marks entry, auto-calculated grades, and digital report cards',
    icon: 'Award',
    isCore: false,
    defaultEnabled: true,
  },
  {
    key: 'fees_billing',
    name: 'Fees & Invoicing',
    category: 'Finance',
    description: 'Fee structures, student invoices, payment collection, receipts, and balance summaries',
    icon: 'CreditCard',
    isCore: false,
    defaultEnabled: true,
  },
  {
    key: 'hr_payroll',
    name: 'HR & Staff Leaves',
    category: 'Operations',
    description: 'Leave applications, multi-tier HOD approvals, staff directory, and records',
    icon: 'Briefcase',
    isCore: false,
    defaultEnabled: true,
  },
  {
    key: 'communication',
    name: 'Announcements & Messages',
    category: 'Operations',
    description: 'Campus broadcasts, targeted notices to parents or faculty, circulars, and notifications',
    icon: 'Megaphone',
    isCore: false,
    defaultEnabled: true,
  },
  {
    key: 'ai_assistant',
    name: 'AI Academic Assistant',
    category: 'Intelligence',
    description: 'AI lesson plan assistant, question generator, and student performance insights',
    icon: 'Sparkles',
    isCore: false,
    defaultEnabled: false,
  },
];
