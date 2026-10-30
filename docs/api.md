# NexEdu ERP - REST API Architecture & Endpoint Specification
**Consistent, High-Throughput RESTful API Specification**

---

## 1. API Standards & Conventions

### 1.1 Base URL
All API routes follow the versioned prefix `/api/v1/`.

### 1.2 Authentication & Security Headers
- Bearer Token: `Authorization: Bearer <jwt_access_token>`
- Super Admin Impersonation: `X-Impersonate-School-Id: <school_uuid>` (only allowed for authenticated Super Admins; logged in audit trail).
- Response Content-Type: `application/json; charset=utf-8`

### 1.3 Uniform Envelope Response Standard
All JSON responses maintain a predictable contract:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 1420
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "User lacks 'marks.enter' permission for Class 10-A Mathematics",
    "details": []
  }
}
```

---

## 2. Core Endpoint Catalog

### 2.1 Authentication & Profile
- `POST /api/v1/auth/login`: Authenticate email/password, issue JWT + HTTP-only refresh cookie.
- `POST /api/v1/auth/logout`: Revoke active session tokens.
- `GET /api/v1/auth/me`: Retrieve current user profile, active school tenant, dynamic permissions, enabled modules, and visual theme settings.
- `POST /api/v1/auth/switch-tenant`: Super Admin switch active context.

### 2.2 Super Admin Platform Operations
- `GET /api/v1/super-admin/dashboard`: Platform KPIs (Total schools, active students, revenue, license alerts).
- `GET /api/v1/super-admin/schools`: Filterable list of institutional tenants with subscription statuses.
- `POST /api/v1/super-admin/schools`: Provision new school tenant, owner account, default academic year, roles, and modules.
- `PATCH /api/v1/super-admin/schools/:id/status`: Suspend / activate / archive school tenant.
- `GET /api/v1/super-admin/audit-logs`: Global platform audit logs.

### 2.3 School Administration & Customization
- `GET /api/v1/schools/settings`: Institutional profile, branding colors, academic calendar settings.
- `PATCH /api/v1/schools/settings`: Update school name, logos, primary/accent colors, and contact info.
- `GET /api/v1/schools/modules`: School module toggles state.
- `PATCH /api/v1/schools/modules`: Enable or disable specific modules.
- `GET /api/v1/schools/roles`: List all custom and system roles with permission counts.
- `POST /api/v1/schools/roles`: Create custom role with permission matrix selections.
- `PUT /api/v1/schools/roles/:id`: Update role permissions.
- `GET /api/v1/schools/departments`: List school departments and member counts.
- `POST /api/v1/schools/departments`: Create department with designated HOD.

### 2.4 Academics & Class Structure
- `GET /api/v1/academics/years`: Academic sessions (e.g., 2026-2027).
- `GET /api/v1/academics/classes`: Classes/Grades with sections count and student tallies.
- `POST /api/v1/academics/classes`: Create class and attached sections.
- `GET /api/v1/academics/subjects`: Subjects directory.
- `POST /api/v1/academics/subjects`: Create subject with theory/practical types.
- `GET /api/v1/academics/class-subjects`: Class-to-Subject teacher allocations.

### 2.5 People Management
- `GET /api/v1/students`: Filterable student directory (by class, section, status, search query).
- `POST /api/v1/students`: Enroll student with parent linking and admission number generation.
- `GET /api/v1/students/:id`: Detailed student 360 profile (overview, attendance, marks, fees, documents).
- `GET /api/v1/teachers`: Faculty and staff directory.
- `POST /api/v1/teachers`: Onboard teacher, link department, employee code, and system role.
- `GET /api/v1/parents`: Parent records with associated children list.

### 2.6 Operations & Daily Academic Workflows
- `GET /api/v1/attendance`: Fetch class attendance sheet for a given date.
- `POST /api/v1/attendance/bulk`: Save bulk attendance entries (Present, Absent, Late, Excused).
- `GET /api/v1/attendance/stats`: Attendance analytics, low attendance warning thresholds.
- `GET /api/v1/homework`: List homework assignments filtered by class/subject.
- `POST /api/v1/homework`: Create homework assignment with attachments and max score.
- `GET /api/v1/exams`: Exam schedule listings and grading scales.
- `POST /api/v1/exams`: Schedule new examination session.
- `GET /api/v1/marks`: Fetch marks gradebook grid for a section and exam.
- `POST /api/v1/marks/bulk`: Bulk enter marks with automatic grade computation.
- `GET /api/v1/fees/invoices`: Invoices and balance statements.
- `POST /api/v1/fees/collect`: Record payment receipt with auto-numbering.
