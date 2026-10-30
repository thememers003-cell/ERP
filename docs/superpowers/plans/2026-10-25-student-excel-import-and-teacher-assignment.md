# Student Excel Import & Class Teacher Attendance Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an end-to-end workflow for importing students via Excel templates, assigning class teachers to sections from Admin, and scoping attendance marking and student dashboard visibility based on that assignment.

**Architecture:** 
1. Client/server Excel processing using `xlsx` to generate downloadable templates and parse bulk imports with case-insensitive column and class-section matching.
2. Section-level `classTeacherId` assignment in `/admin/classes` persisted to the database and mirrored to `UserPermissionScope`.
3. Scoped attendance retrieval and submission in `/api/attendance` and `/attendance`, with assigned class teacher reflection in student-facing views (`/student`, `/student/attendance`).

**Tech Stack:** Next.js 14 (App Router), Prisma ORM, SQLite, TypeScript, Lucide React, SheetJS (`xlsx`).

**Spec:** [docs/superpowers/specs/2026-10-25-student-excel-import-and-teacher-assignment-design.md](file:///c:/Users/ADMIN/Desktop/SCHOOL%20ERP/docs/superpowers/specs/2026-10-25-student-excel-import-and-teacher-assignment-design.md)

## Global Constraints
- Do not introduce breaking schema migrations; utilize existing fields `Section.classTeacherId`, `UserPermissionScope`, `Student`, and `AttendanceRecord`.
- Admins (`ADMIN`, `SCHOOL_OWNER`, `isSuperAdmin`) retain global unrestricted access across all school sections.
- When an Excel file is imported, existing students are updated without discarding their historical attendance, invoice, or marks records.

## Review Focus
1. Header alias variations in Excel (`Roll #` vs `Roll Number`, `Class` vs `Grade`, `Adm No` vs `Admission Number`) must resolve without failures.
2. Section name resolution should match both "Section A" and "A" case-insensitively.
3. Unassigning or reassigning a teacher must update both `Section.classTeacherId` and revoke/update the corresponding `UserPermissionScope`.
4. Teacher visiting `/attendance` with zero assigned sections should see a helpful guidance prompt rather than a crash or empty blank screen.
5. Student dashboard must display the assigned Class Teacher dynamically from `student.section.classTeacher`.

---

### Task 1: Downloadable Excel Template & Import Normalizer in `src/lib/excel.ts`

**Files:**
- Modify: `src/lib/excel.ts`

**Interfaces:**
- Produces: `downloadStudentImportTemplate(classes: Array<{ name: string, sections: Array<{ name: string }> }>): void`

- [ ] **Step 1: Implement `downloadStudentImportTemplate` in `src/lib/excel.ts`**
Add helper function that builds sample rows with headers: `First Name`, `Last Name`, `Email`, `Admission Number`, `Roll Number`, `Class`, `Section`, `Gender`, `Blood Group`, `Parent Name`, `Parent Phone` using `XLSX.utils.json_to_sheet` and `XLSX.writeFile`.

- [ ] **Step 2: Verify `excel.ts` compiles cleanly**
Run: `npm.cmd run build` (or `npx.cmd tsc --noEmit`)
Expected: PASS with 0 type errors.

- [ ] **Step 3: Commit**
```bash
git add src/lib/excel.ts
git commit -m "feat: add downloadable student Excel template generator"
```

---

### Task 2: Robust Bulk Student Import API (`/api/import/students`)

**Files:**
- Modify: `src/app/api/import/students/route.ts`

**Interfaces:**
- Consumes: `{ rows: any[] }`
- Produces: `{ success: true, data: { imported: number, errors: string[], updated: number } }`

- [ ] **Step 1: Enhance `src/app/api/import/students/route.ts`**
Support normalized key aliases for each row (e.g. `First Name` / `firstName` / `FirstName`). Normalize class matching (e.g. matching "8", "Grade 8", "Class 8") and section matching ("A", "Section A"). Ensure duplicate student admission numbers in the file or existing DB are cleanly updated rather than crashing.

- [ ] **Step 2: Test API using scratch script or curl**
Verify POST `/api/import/students` with sample rows creates/updates students and links them to the active academic year.

- [ ] **Step 3: Commit**
```bash
git add src/app/api/import/students/route.ts
git commit -m "feat: enhance bulk student import with robust matching and upsert"
```

---

### Task 3: Excel Import Modal UI Enhancements in `src/app/students/page.tsx`

**Files:**
- Modify: `src/app/students/page.tsx`

**Interfaces:**
- Consumes: `downloadStudentImportTemplate`, `/api/import/students`

- [ ] **Step 1: Add "Download Sample Template" button and row preview in `src/app/students/page.tsx`**
In the Import modal:
- Add a prominent "Download Sample Excel Template" button.
- After selecting an Excel/CSV file, render a preview table showing the parsed records (first 5 rows) and total rows detected.
- Display detailed feedback upon completion (count of imported/updated students, plus warnings/errors if any).

- [ ] **Step 2: Verify UI in browser or build check**
Run: `npx.cmd tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**
```bash
git add src/app/students/page.tsx
git commit -m "feat: add template download and import preview in students directory"
```

---

### Task 4: Class Teacher Assignment API & Scope Synchronization

**Files:**
- Create/Modify: `src/app/api/academics/sections/[id]/route.ts`
- Modify: `src/app/api/academics/classes/route.ts`

**Interfaces:**
- `GET /api/academics/classes`: Includes `sections.classTeacher` (id, user details)
- `PUT /api/academics/sections/[id]`: Accepts `{ classTeacherId: string | null }`, updates `Section.classTeacherId`, and syncs `UserPermissionScope` for that teacher on `sectionId` and `classId`.

- [ ] **Step 1: Update `src/app/api/academics/classes/route.ts` to include `classTeacher`**
In `prisma.classGrade.findMany`, include `sections: { include: { classTeacher: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } } }`.

- [ ] **Step 2: Create `src/app/api/academics/sections/[id]/route.ts`**
Handle `PUT`:
- Authorize admin / school owner.
- Update `prisma.section.update` with `classTeacherId`.
- Sync `prisma.userPermissionScope`: if new teacher assigned, upsert scope for teacher's `userId` with `classId` and `sectionId`. If cleared, remove previous teacher scope.

- [ ] **Step 3: Verify API with test build**
Run: `npx.cmd tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add src/app/api/academics/classes/route.ts src/app/api/academics/sections/[id]/route.ts
git commit -m "feat: add section class teacher assignment and scope sync API"
```

---

### Task 5: Admin UI for Class Teacher Assignment in `/admin/classes`

**Files:**
- Modify: `src/app/admin/classes/page.tsx`

**Interfaces:**
- Consumes: `/api/academics/classes`, `/api/teachers`, `PUT /api/academics/sections/[id]`

- [ ] **Step 1: Enhance section cards in `src/app/admin/classes/page.tsx`**
- Show current class teacher badge (`UserCheck` icon, teacher's name or "No Class Teacher").
- Add an "Assign Teacher" button for each section.
- Create an "Assign Class Teacher" modal that lists all teachers in the school with a search/filter dropdown.
- On saving, call `PUT /api/academics/sections/[id]` and refresh the classes list.

- [ ] **Step 2: Verify component rendering and state updates**
Run: `npx.cmd tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**
```bash
git add src/app/admin/classes/page.tsx
git commit -m "feat: add class teacher assignment modal and badges in admin classes page"
```

---

### Task 6: Scoped Attendance Execution for Teachers (`/api/attendance` & `/attendance`)

**Files:**
- Modify: `src/app/api/attendance/route.ts`
- Modify: `src/app/attendance/page.tsx`

**Interfaces:**
- In `/api/attendance`, filter available sections and validate attendance marking against assigned sections if user is a teacher.
- In `/attendance`, automatically preselect and highlight teacher's assigned section(s).

- [ ] **Step 1: Update `src/app/api/attendance/route.ts`**
Check teacher role: If caller is a teacher and not admin/owner, load sections where `section.classTeacherId == teacherProfile.id` or user holds scope. Only allow attendance marking for permitted sections.

- [ ] **Step 2: Update `src/app/attendance/page.tsx`**
Display assigned sections prominently. If teacher is assigned to "Grade 8 - Section A", show a badge "Assigned Class Teacher" on that section.

- [ ] **Step 3: Verify build and test flow**
Run: `npx.cmd tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add src/app/api/attendance/route.ts src/app/attendance/page.tsx
git commit -m "feat: scope attendance page and API to assigned class teachers"
```

---

### Task 7: Update Student Dashboard & Attendance Views (`/student` & `/student/attendance`)

**Files:**
- Modify: `src/app/student/page.tsx`
- Modify: `src/app/student/attendance/page.tsx`
- Modify: `src/app/api/students/route.ts` (include section class teacher)

**Interfaces:**
- In `/api/students` and student endpoints, include `section.classTeacher.user`.
- On `/student` dashboard and `/student/attendance`, render the assigned Class Teacher card (name, email, designation).

- [ ] **Step 1: Include classTeacher in student queries**
Update `prisma.student.findFirst` in `/api/attendance` (student view) and `/student` to include `section: { include: { classTeacher: { include: { user: true } } } }`.

- [ ] **Step 2: Render Class Teacher profile in `/student` and `/student/attendance`**
Add a dedicated "My Class Teacher" card displaying their name, email, and room number.

- [ ] **Step 3: Build & end-to-end verification**
Run: `npm.cmd run build`
Expected: Build passes with 0 errors.

- [ ] **Step 4: Commit**
```bash
git add src/app/student/page.tsx src/app/student/attendance/page.tsx src/app/api/students/route.ts
git commit -m "feat: display assigned class teacher on student dashboard and attendance page"
```
