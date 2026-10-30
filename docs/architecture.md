
# NexEdu ERP - System Architecture Specification
**Enterprise Multi-Tenant SaaS Platform for Educational Institutions**
*Inspired by OpenEduCat, Frappe/ERPNext, Odoo, Linear, Notion, and Stripe*

---

## 1. Executive Architecture Overview

NexEdu is engineered as a cloud-native, multi-tenant Education ERP SaaS operating system. It bridges the deep operational domain modeling of systems like Odoo and Frappe with the ultra-responsive, sleek, keyboard-first UX of modern software like Linear and Stripe.

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                       |
|  Next.js 14 / Vite React SPA | Tailwind + Modern Design Tokens | Lucide Icons        |
|  Command Palette (Ctrl+K) | Real-time Sockets | Dark/Light Themes | Brand Customizer   |
+---------------------------------------------------------------------------------------+
                                           |  HTTPS / REST / WebSocket
                                           v
+---------------------------------------------------------------------------------------+
|                                 API GATEWAY & SECURITY                                |
|  Tenant Resolver Middleware | RBAC & Granular Policy Engine | Rate Limiter | Audit    |
+---------------------------------------------------------------------------------------+
                                           |
    +--------------------------------------+-------------------------------------+
    |                                      |                                     |
    v                                      v                                     v
+-----------------------+      +-----------------------+      +-----------------------+
|   PLATFORM CORE       |      |   ACADEMIC ENGINE     |      |   BUSINESS & OPS      |
| - Super Admin Portal  |      | - Program & Batches   |      | - Fee & Billing       |
| - Tenant Provisioning |      | - Classes & Sections  |      | - HR & Payroll        |
| - Subscription Billing|      | - Student Lifecycle   |      | - Transport & GPS     |
| - Feature Flags       |      | - Timetable & Rooms   |      | - Library & Barcode   |
| - Global Module Store |      | - Grading & Exams     |      | - Inventory & Assets  |
+-----------------------+      +-----------------------+      +-----------------------+
                                           |
    +--------------------------------------+-------------------------------------+
    |                                      |                                     |
    v                                      v                                     v
+-----------------------+      +-----------------------+      +-----------------------+
| DYNAMIC PERMISSION    |      | WORKFLOW ENGINE       |      | AI ENHANCEMENT LAYER  |
| MATRIX ENGINE         |      | Multi-step State      |      | Lesson Planner,       |
| Row/Scope & Action    |      | Transitions (Leave,   |      | Assessment Generator, |
| Level Security        |      | Expense, Admissions)  |      | Performance Risk      |
+-----------------------+      +-----------------------+      +-----------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                                DATA & STORAGE LAYER                                   |
|  PostgreSQL / Prisma ORM | Tenant Row Isolation (`schoolId`) | S3 File Storage        |
|  Redis Cache / PubSub    | Audit Log Ledger          | Full-Text Search Indices       |
+---------------------------------------------------------------------------------------+
```

---

## 2. Multi-Tenancy Strategy

### 2.1 Tenant Isolation Architecture
NexEdu implements **Logical Shared-Database Multi-Tenancy with Strict Row-Level and Query-Level Enforced Isolation**:
1. **Tenant Identification**: Every institutional resource is bound to a `schoolId` (UUID).
2. **Context Derivation**: The active tenant is **never** accepted from untrusted client payload params. Instead, it is cryptographically resolved by the backend security middleware from the verified JWT / session context:
   - Super Admin: Cross-tenant privileges with impersonation tracking.
   - School Users: Rigidly locked to their issued `schoolId`.
3. **ORM Tenant Extension**: Prisma Client middleware and query wrappers automatically inject `WHERE schoolId = context.schoolId` on all reads, updates, and deletes, preventing tenant leakage.
4. **Data Isolation Invariants**: Unique indexes are scoped composite keys (e.g. `[schoolId, admissionNumber]`, `[schoolId, employeeId]`, `[schoolId, code]`).

---

## 3. Layered Component Architecture

### 3.1 Controller-Service-Repository Pattern
```
Request -> Route Middleware (Auth + Tenant + Permission)
        -> Controller (Validation, HTTP Mapping, Status Codes)
        -> Service Layer (Domain Logic, Workflow Triggers, Event Dispatch)
        -> Data Access Layer (Prisma ORM Scoped Queries)
        -> Audit Logger (Entity Change Tracking)
        -> Response Transformer (Consistent JSON Schema)
```

### 3.2 Dynamic Module System
Every school can toggle functional modules (e.g., Fees, Transport, Hostel, AI Assistant). When a module is toggled:
1. **API Guard**: Routes tagged with `@RequiresModule('fees')` reject requests with `403 Module Disabled`.
2. **Dynamic Navigation**: Client layout hydrates only accessible modules based on both School-Enabled Modules and User-Permission grants.
3. **Dashboard Widgets**: School dashboards automatically reorganize, hiding disabled module analytics.

---

## 4. Key Borrowed Paradigms from Industry Benchmarks

| Platform | Architectural Inspiration Adopted |
| :--- | :--- |
| **OpenEduCat (Odoo)** | Hierarchical academic structure (Academic Term -> Program -> Course -> Batch), faculty assignment, flexible evaluation scales, multi-course timetables. |
| **Frappe / ERPNext** | DocType-style configurable metadata, dynamic Role Profiles, granular row-level user permissions (restrict by class, section, subject), audit trail history. |
| **Linear** | Ultra-responsive state, command palette (`Ctrl+K`), keyboard navigation, instant optimistic UI, notification drawer, clean monochrome + vibrant accent design. |
| **Stripe** | Production-grade onboarding workflows, idempotent financial ledger entries, developer-friendly clean REST error responses, webhook-ready event architecture. |
| **Notion** | Modular layout flexibility, customizable dashboard widgets, structured document and notes association on student/staff profiles. |

---

## 5. Security Architecture & Threat Model

1. **Authentication**: Argon2id / bcrypt password hashing, JWT with short expiration + secure HTTP-only refresh tokens, session revocation lists.
2. **Authorization**: Multi-layered RBAC + Dynamic Permission Matrix (DPM) + Attribute/Scope-Based Access Control (ABAC).
3. **Audit Trail**: Every mutating operation records `actorId`, `schoolId`, `action`, `resource`, `diff (old vs new)`, `ipAddress`, and `userAgent`.
4. **Input Sanitization**: Zod validation schemas for all inputs; SQL injection prevention via parameterized queries in Prisma.
5. **Secure Uploads**: Presigned S3/MinIO URLs with MIME-type and size verification; zero direct binary blobs stored inside relational database tables.
