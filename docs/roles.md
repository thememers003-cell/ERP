# NexEdu ERP - Dynamic Role Builder & Role Profiles
**Configurable Identity Hierarchy Inspired by Frappe & Odoo Security Groups**

---

## 1. Role Architecture Philosophy

Traditional ERPs hardcode a rigid enum: `ADMIN | TEACHER | STUDENT | PARENT`. NexEdu completely abandons this anti-pattern. 

In NexEdu:
- **Roles are dynamic database records** created and configured by School Administrators.
- A School Administrator can create tailored operational titles such as:
  - `"Vice Principal (Academic Affairs)"`
  - `"Junior Mathematics Teacher"`
  - `"Senior Biology Faculty & Lab Incharge"`
  - `"Fee Counter Cashier"`
  - `"Transportation Coordinator"`
  - `"Hostel Warden"`
- Users can possess **multiple roles** concurrently (e.g. A user can be both `Maths Teacher` and `HOD - Mathematics`).

---

## 2. Standard Baseline System Roles (Seeded on School Onboarding)

When a new school is provisioned, NexEdu automatically seeds the institution with standard baseline roles that can be further modified:

| Role Name | System Code | Scope & Intended Responsibilities |
| :--- | :--- | :--- |
| **School Owner** | `SCHOOL_OWNER` | Ultimate institution owner. Full administrative override across all modules, settings, and billing. |
| **Principal / Director** | `PRINCIPAL` | High-level academic and disciplinary oversight, report card authorization, final leave approver. |
| **Head of Department** | `HOD` | Departmental lead. Curriculum tracking, teacher allocations, Stage-1 leave approvals. |
| **Class Teacher** | `CLASS_TEACHER` | Direct oversight over a specific class/section: daily roll-call attendance, report card remark composition. |
| **Subject Teacher** | `SUBJECT_TEACHER` | Subject syllabus tracking, homework authoring, assignment grading, exam mark entry for assigned classes. |
| **Accountant / Cashier** | `ACCOUNTANT` | Fee structure configuration, fee collection, receipt generation, invoice tracking, payroll ledger. |
| **Student** | `STUDENT` | Self-service portal: view personal attendance, homework submissions, exam grades, timetable, fee status. |
| **Parent / Guardian** | `PARENT` | Family portal: view all enrolled children, attendance alerts, progress reports, online fee payments. |

---

## 3. Creating Custom Roles (Interactive Role Builder)

The School Administrator can navigate to **Settings → Roles & Permissions → Create Custom Role**:

### Step 1: Role Metadata
- **Role Name**: e.g. `"Junior Maths Teacher"`
- **Department**: e.g. `"Mathematics"`
- **Description**: e.g. `"Grade 6 to 8 Mathematics teacher with homework & marks privileges"`
- **Base Template**: Optionally clone permissions from an existing role (e.g., clone from `Subject Teacher`).

### Step 2: Permission Matrix Grid
Toggle specific actions for each functional module:
- Students: `View` (Checked) | `Create` (Unchecked) | `Edit` (Unchecked) | `Delete` (Unchecked)
- Attendance: `View` (Checked) | `Mark` (Checked) | `Edit` (Checked) | `Approve` (Unchecked)
- Homework: `View` (Checked) | `Create` (Checked) | `Edit` (Checked) | `Evaluate` (Checked)
- Marks: `View` (Checked) | `Enter` (Checked) | `Edit` (Checked) | `Publish` (Unchecked)
- Fees: All Unchecked
- Payroll: All Unchecked

### Step 3: Assignment & Granular Scope
Assign the role to specific employees, with optional narrowing scopes (e.g. limit to Class 6, 7, 8).
