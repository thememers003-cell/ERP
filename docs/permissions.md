# NexEdu ERP - Dynamic Permissions & Scope Authorization Matrix
**The Core Security Engine of the ERP**

---

## 1. Overview

The authorization engine in NexEdu surpasses basic role-based access control (RBAC). Modeled after Frappe's User Permissions and AWS IAM Policy Evaluation, it enforces **Context-Aware Dynamic Scoping (ABAC + RBAC)**.

A user does not merely have "Teacher" or "Accountant" role. Instead, access is evaluated as:
$$\text{CanAccess}(User, Resource, Action, TargetContext)$$

Where:
- **Module Check**: Is the module enabled for this School Tenant?
- **Action Check**: Does the user's role possess the action permission (`VIEW`, `CREATE`, `EDIT`, `DELETE`, `EXPORT`, `IMPORT`, `APPROVE`)?
- **Scope Restriction**: Is the user restricted to specific Classes, Sections, Subjects, or Departments?

---

## 2. Granular Module & Action Catalog

| Module | Available Actions | Scoping Dimensions |
| :--- | :--- | :--- |
| **`students`** | `VIEW`, `CREATE`, `EDIT`, `DELETE`, `EXPORT`, `IMPORT` | `classId`, `sectionId` |
| **`teachers`** | `VIEW`, `CREATE`, `EDIT`, `DELETE`, `EXPORT` | `departmentId` |
| **`academics`** | `VIEW`, `CREATE`, `EDIT`, `DELETE` | `classId`, `subjectId` |
| **`attendance`** | `VIEW`, `MARK`, `EDIT`, `APPROVE`, `EXPORT` | `classId`, `sectionId` |
| **`homework`** | `VIEW`, `CREATE`, `EDIT`, `EVALUATE`, `DELETE` | `classId`, `sectionId`, `subjectId` |
| **`exams`** | `VIEW`, `CREATE`, `EDIT`, `PUBLISH`, `EXPORT` | `classId`, `subjectId` |
| **`marks`** | `VIEW`, `ENTER`, `EDIT`, `PUBLISH`, `EXPORT` | `classId`, `sectionId`, `subjectId` |
| **`fees`** | `VIEW`, `CREATE`, `COLLECT`, `REFUND`, `EXPORT` | `classId`, School-wide |
| **`payroll`** | `VIEW`, `CREATE`, `PROCESS`, `EXPORT` | `departmentId` |
| **`leave`** | `VIEW`, `APPLY`, `APPROVE_HOD`, `APPROVE_ADMIN` | `departmentId` |
| **`communication`**| `VIEW`, `SEND`, `SCHEDULE`, `BROADCAST` | Target Audience Scope |
| **`reports`** | `VIEW`, `GENERATE`, `DOWNLOAD` | Module Scope |
| **`settings`** | `VIEW`, `EDIT_ROLES`, `EDIT_MODULES`, `EDIT_BRANDING`| School-wide |

---

## 3. Scope Restriction Examples

### Example 1: Junior Mathematics Teacher
- **Assigned Role**: `Subject Teacher`
- **Scopes Configured**:
  - `classId`: Grade 8, Grade 9
  - `subjectId`: Mathematics
- **Resulting Access**:
  - Can view students in Grade 8 and Grade 9.
  - Can mark attendance and assign homework **only** for Grade 8 and Grade 9 Mathematics.
  - Denied access to Grade 10, English, or Physics records.
  - Denied all access to Fees and Payroll.

### Example 2: Mathematics Head of Department (HOD)
- **Assigned Role**: `HOD`
- **Department**: `Mathematics`
- **Scopes Configured**:
  - `departmentId`: Mathematics Department
- **Resulting Access**:
  - Can view all Mathematics teachers.
  - Can approve Stage-1 Leave Applications for members of the Mathematics department.
  - Cannot approve leaves for the Science or Administration department.

---

## 4. Evaluation Algorithm (Backend Security Interceptor)

```typescript
async function verifyPermission(context: AuthContext, requirement: {
  module: string;
  action: string;
  target?: {
    classId?: string;
    sectionId?: string;
    subjectId?: string;
    departmentId?: string;
  }
}): Promise<boolean> {
  // 1. Super Admin bypass (with audit log trigger)
  if (context.isSuperAdmin) return true;

  // 2. Ensure school tenant matches
  if (!context.schoolId) return false;

  // 3. Module Flag check (Tenant Level)
  const isModuleActive = await moduleService.isModuleActive(context.schoolId, requirement.module);
  if (!isModuleActive) return false;

  // 4. School Owner / Admin wildcard
  if (context.roles.includes('SCHOOL_ADMIN') || context.roles.includes('OWNER')) return true;

  // 5. Role Action Capability check
  const hasActionGrant = context.permissions.some(
    p => p.module === requirement.module && p.action === requirement.action
  );
  if (!hasActionGrant) return false;

  // 6. Scope Constraint Check (ABAC)
  if (requirement.target && context.scopes.length > 0) {
    return evaluateScopeConstraint(context.scopes, requirement.target);
  }

  return true;
}
```

---

## 5. Visual Permission Matrix Builder

The UI delivers a matrix table with interactive toggles:
- **Rows**: Modules and sub-resources
- **Columns**: `VIEW`, `CREATE`, `EDIT`, `DELETE`, `SPECIAL` (e.g., `APPROVE`, `PUBLISH`)
- **Quick Profiles**: Presets for "Full Admin", "Teacher", "Department Lead", "Finance Staff", "Read-Only Auditor"
- **Scope Drawer**: Slide-out drawer allowing assignment of exact Grade/Section/Subject tuples to any user or role.
