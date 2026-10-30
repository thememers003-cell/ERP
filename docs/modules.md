# NexEdu ERP - Modular System Architecture
**Pluggable, Decoupled Architecture Inspired by Odoo & Frappe**

---

## 1. Modular Philosophy

Like Odoo apps and Frappe apps, every functional domain in NexEdu is structured as an isolated, self-contained module. Modules declare:
1. **Metadata**: Key, Name, Category, Icon, Version, Dependencies.
2. **Database Models & Seed Data**: Default roles, permissions, settings.
3. **Route Handlers & Security Gates**: Module-level guards.
4. **UI Navigation & Dashboard Widgets**: Dynamic registration in the navigation tree.

---

## 2. Global Module Registry

| Module Key | Category | Core Dependencies | Default State | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`core_academics`** | Academic | None | Mandatory (Always On) | Academic sessions, classes, sections, subjects, classrooms. |
| **`students`** | People | `core_academics` | Mandatory | Comprehensive student profiles, admission numbers, parents, health. |
| **`teachers`** | People | None | Mandatory | Staff directory, teacher profiles, qualifications, department assignment. |
| **`departments`** | Management | None | Mandatory | Flexible departments, HOD assignments, member scoping. |
| **`attendance`** | Operations | `students`, `core_academics`| Enabled | Student & staff daily attendance, period attendance, leave logs. |
| **`homework`** | Academic | `students`, `core_academics`| Enabled | Homework posting, digital submissions, teacher evaluation, grading. |
| **`examinations`**| Academic | `students`, `core_academics`| Enabled | Exam terms, datesheets, grading systems, marks entry, digital report cards. |
| **`fees_billing`** | Finance | `students` | Optional | Fee categories, recurring invoices, payments, receipts, discounts. |
| **`hr_payroll`** | Management | `teachers`, `departments` | Optional | Staff attendance, salary structures, payslips, leave workflows. |
| **`communication`**| Ops | None | Optional | Announcements, internal messages, SMS/Email broadcasts, circulars. |
| **`transport`** | Operations | `students` | Optional | Vehicle tracking, route stops, driver logs, live GPS integration readiness. |
| **`library`** | Operations | `students`, `teachers` | Optional | Catalog, ISBN tracking, circulation, barcode issue/return, fines. |
| **`ai_assistant`** | Intelligence | None | Optional | AI lesson planner, assessment generator, at-risk student insights. |

---

## 3. Module Lifecycle & Toggle Mechanics

### 3.1 Tenant Toggle Flow
When a School Administrator navigates to **Settings → Modules** and flips a switch (e.g. enabling or disabling `fees_billing`):

```
[Admin clicks Toggle 'fees_billing']
          │
          ▼
[POST /api/settings/modules/toggle]
          │
          ├── 1. Validates user has 'settings.edit_modules' permission
          ├── 2. Checks platform plan tier limits (e.g., Free vs Pro vs Enterprise)
          ├── 3. Verifies dependent modules (e.g., cannot disable 'core_academics' if 'students' is active)
          ├── 4. Updates 'SchoolModule' status record in DB
          ├── 5. Emits 'school.module_updated' event to invalidate Redis cache
          └── 6. Returns fresh tenant configuration payload
```

### 3.2 Enforcement Points
- **API Interceptor**: Every API route belongs to a module. If the school has disabled that module, the API immediately halts execution with:
  ```json
  {
    "success": false,
    "error": {
      "code": "MODULE_DISABLED",
      "message": "The Fees & Billing module is currently inactive for this institution."
    }
  }
  ```
- **Navigation Engine**: The client sidebar filters nav groups in real-time. Disabled modules never render in navigation links.
- **Search Palette (Ctrl+K)**: Commands and quick actions for disabled modules are filtered out.
- **Dashboard Composer**: Widgets linked to disabled modules are automatically hidden from school dashboards.
