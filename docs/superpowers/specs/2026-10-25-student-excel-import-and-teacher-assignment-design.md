# Design Specification: Student Excel Import & Class Teacher Attendance Assignment

**Date**: 2026-10-25  
**Topic**: Student Bulk Excel Import & Class Teacher Attendance Assignment  
**Status**: Ready for Review  

---

## 1. Intent & The Why

School administrators need a reliable and quick method to onboard student rosters by class and section via Excel spreadsheets, avoiding repetitive manual data entry. Furthermore, administrators need to assign designated Class Teachers to each section so that faculty members are automatically authorized and directed to mark daily attendance and view student profiles for their assigned learners, while administrators maintain global administrative oversight.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Excel Student Import**:
  - Provide a one-click **"Download Sample Excel Template"** (`Student_Import_Template.xlsx`) pre-populated with correct column headers, sample data, and guidelines.
  - Enhance the import modal in `/students` to show uploaded row previews, validate records (class name, section, email, admission #), and display itemized import results (imported count, warnings/errors).
- **Admin Class-Teacher Assignment**:
  - In `/admin/classes`, display the currently assigned Class Teacher on every section card.
  - Provide an intuitive modal/action to assign or reassign any faculty member as the Class Teacher of that section.
  - Persist the assignment to `Section.classTeacherId` and automatically synchronize `UserPermissionScope` records for `classId` and `sectionId`.
- **Attendance & Student Access Enforcement**:
  - When a Teacher visits `/attendance`, filter or pre-select the sections they are assigned to, and permit marking attendance for those classes.
  - Ensure School Admins and Principals retain unrestricted ability to select and mark any class.

### Non-Goals
- Complex multi-period substitution approval workflows (out of scope for daily attendance).
- Automatic biometric device hardware synchronization.

### Anti-Goals
- Hardcoding permissions or roles in frontend components without enforcing database-level scoping in API endpoints (`/api/attendance`, `/api/students`).
- Overwriting existing student attendance or fee records when re-running student imports.

---

## 3. Approaches Considered

### Approach A: Integrated Class Teacher Assignment & Role Scoping (Selected)
- **Description**: Connect `Section.classTeacherId` directly with Admin management in `/admin/classes`, sync with `UserPermissionScope`, provide downloadable template in `/students`, and scope `/attendance` based on teacher assignments.
- **Trade-offs**: Fast, clean, directly utilizes existing Prisma schema models without requiring extra database migrations.
- **Decision**: Chosen because it provides immediate end-to-end functionality with minimal configuration friction.

### Approach B: Dual Granular Matrix (Class Teacher + Period Subject Teacher)
- **Description**: Require configuring both primary class teachers for roll call and individual subject teachers for every period slot.
- **Trade-offs**: High administrative configuration overhead before any teacher can mark attendance.
- **Decision**: Deferred for future timetable-centric expansions.

---

## 4. Technical Architecture & Implementation Details

### A. Downloadable Excel Template & Import Enhancements
- **Template Generation**: Add a helper function in `src/lib/excel.ts` using `xlsx` to produce a styled `.xlsx` file containing:
  - Columns: `First Name`, `Last Name`, `Email`, `Admission Number`, `Roll Number`, `Class`, `Section`, `Gender`, `Blood Group`, `Parent Name`, `Parent Phone`.
  - Realistic sample rows matching the school's active grades (e.g. `Grade 8`, `Section A`).
- **Modal UI in `/students`**:
  - Add "Download Sample Template" button in the modal.
  - Preview uploaded rows before triggering final import.
  - Display success badge and specific row-level error list if validation fails.
- **API `/api/import/students`**:
  - Enhance matching logic to gracefully handle case-insensitive class and section matching.
  - Return `{ imported: number, errors: string[] }`.

### B. Admin Class-Teacher Assignment (`/admin/classes`)
- **API Endpoint**:
  - `PUT /api/academics/sections/[id]/teacher` or `PUT /api/academics/sections` to set `classTeacherId` on a section.
  - Ensure updating `classTeacherId` creates or updates a `UserPermissionScope` for that teacher with `classId` and `sectionId`.
- **UI in `/admin/classes`**:
  - In each section pill/card, display an "Assign Teacher" button showing the current class teacher's name (or "No Teacher Assigned").
  - Clicking opens a modal with a searchable dropdown of faculty members (`/api/teachers`).
  - Submitting sends the update and updates the live card with feedback.

### C. Scoped Attendance Execution (`/attendance` & `/api/attendance`)
- **API Scoping in `/api/attendance`**:
  - When a user with teacher roles queries sections or attendance, filter default sections to those where `section.classTeacherId == teacher.id` or user has matching `UserPermissionScope`.
  - Allow Admin / School Owner to access all sections.
- **UI in `/attendance`**:
  - If a teacher is assigned to Section 8-A, automatically select Section 8-A by default.
  - If a teacher attempts to access an unauthorized section, provide clear feedback or only list their assigned sections in the dropdown.

---

## 5. What's Left to the Builder
- Precise styling of the "Assign Class Teacher" modal using existing design system classes (`btn`, `input`, `select`, `modal`).
- Excel column alias normalization in `/api/import/students` (e.g., matching both `Roll #` and `Roll Number`).
