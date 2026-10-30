# EduAI Studio, Smart Timetable with Auto-Substitute Dispatch, and Circulars Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three high-impact modern school modules: an EduAI Lesson & Quiz Studio (`/edu-ai`), a Smart Timetable with 1-click Auto-Substitute Dispatch (`/timetable`), and an Official Circulars Hub with Digital Parent Consent Tracking (`/notices`).

**Architecture:** Next.js 14 App Router, TypeScript, SQLite-compatible persistent API routes, and high-fidelity Linear/Stripe design tokens using Lucide React icons and responsive glassmorphism styles.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind/Vanilla CSS tokens, Lucide React.

**Spec:** [docs/superpowers/specs/2026-10-24-eduai-timetable-notices-design.md](file:///c:/Users/ADMIN/Desktop/SCHOOL%20ERP/docs/superpowers/specs/2026-10-24-eduai-timetable-notices-design.md)

## Global Constraints
- Strictly maintain multi-tenant safety and permission roles.
- Maintain standard Next.js 14 App Router conventions and zero build-breaking dependencies.
- Retain high-end aesthetic styling (deep slate, violet/indigo accents, crisp badges, micro-animations).
- Support printable student worksheet and circular outputs cleanly via `@media print`.

## Review Focus
- Topic prompt injection / empty fields handled gracefully with fallback curriculum defaults in EduAI.
- Timetable substitution correctly detects period conflicts and avoids recommending teachers who already have a class in that slot.
- Publishing from EduAI directly to `/api/homework` preserves generated rubrics and question sets.
- Parent consent state transitions update live counters without page reloads.
- Responsive mobile/tablet layouts for the period grid and drawer modals.

---

### Task 1: EduAI Studio Engine & Page (`/edu-ai`)

**Files:**
- Create: `src/app/api/edu-ai/generate/route.ts`
- Create: `src/app/edu-ai/page.tsx`
- Create: `src/components/WorksheetModal.tsx`

**Interfaces:**
- Consumes: `/api/homework` (for 1-click assignment publishing)
- Produces: EduAI generator API with structured output (`lessonPlan`, `quiz`, `rubrics`)

- [ ] **Step 1: Create `src/app/api/edu-ai/generate/route.ts`**
  - Accept `subject`, `grade`, `board` (CBSE, ICSE, Cambridge, IB), `topic`, `mode` (`LESSON_PLAN` | `QUIZ`).
  - Provide rich educational templates with structured 45-min period breakdown, learning objectives, prior knowledge, vocabulary, exit tickets, and 5-10 question quizzes with answer keys and evaluation rubrics.

- [ ] **Step 2: Create `src/components/WorksheetModal.tsx`**
  - Clean modal formatted as a student printable worksheet with school name, student name, roll number, instructions, and questions.
  - Include print trigger with print-isolated styles.

- [ ] **Step 3: Create `src/app/edu-ai/page.tsx`**
  - Subject selector, grade pills, curriculum dropdown, topic input box, and "Generate with EduAI" action.
  - Interactive tabs: `Lesson Plan` and `Quiz & Rubric`.
  - Action buttons: "Publish directly to Assignments Hub" (calls `/api/homework`) and "Print Student Worksheet" (opens `WorksheetModal`).

---

### Task 2: Smart Timetable & Auto-Substitute Dispatch (`/timetable`)

**Files:**
- Create: `src/app/api/timetable/route.ts`
- Create: `src/app/timetable/page.tsx`
- Create: `src/components/SubstituteModal.tsx`

**Interfaces:**
- Consumes: Teacher roster and class schedules
- Produces: Full weekly 5-day / 8-period timetable with real-time substitution assignments

- [ ] **Step 1: Create `src/app/api/timetable/route.ts`**
  - Handle `GET` (returns schedule for all classes 9-A, 10-A, 10-B, and teachers).
  - Handle `POST` (action `SUBSTITUTE_TEACHER`: identifies periods where the absent teacher is scheduled, finds free qualified teachers with 0 period clashes, and assigns substitute).

- [ ] **Step 2: Create `src/components/SubstituteModal.tsx`**
  - Step 1: Select absent teacher and date.
  - Step 2: System lists affected periods and shows top recommended free teachers ranked by lowest current workload.
  - Step 3: 1-click "Confirm & Notify Substitute" button.

- [ ] **Step 3: Create `src/app/timetable/page.tsx`**
  - Controls: Toggle view by **Class & Section** vs **Teacher**.
  - 5-Day (Mon-Fri) × 8-Period visual schedule grid with subject badges, teacher names, room numbers, and highlighted `SUBSTITUTE` tags.
  - Primary button: `🚨 Report Absence & Find Substitute` opening `SubstituteModal`.

---

### Task 3: Circulars & Parent Digital Consent Hub (`/notices`)

**Files:**
- Create: `src/app/api/notices/route.ts`
- Create: `src/app/notices/page.tsx`
- Create: `src/components/ParentConsentModal.tsx`
- Create: `src/components/CreateNoticeModal.tsx`

**Interfaces:**
- Consumes: Student and parent roster
- Produces: Circulars and event notices with interactive parent consent slip signatures

- [ ] **Step 1: Create `src/app/api/notices/route.ts`**
  - `GET`: Returns list of school circulars with categories (`FIELD_TRIP`, `EXAM_SCHEDULE`, `GENERAL_POLICY`, `EMERGENCY`), consent metrics, and status.
  - `POST`: Drafts a new notice with optional consent requirement.
  - `PUT`: Submits digital parent consent signature with medical/emergency remarks.

- [ ] **Step 2: Create `src/components/ParentConsentModal.tsx`**
  - Displays trip/event itinerary, departure/return time, cost, safety instructions.
  - Interactive form for Parent/Guardian Name, Emergency Phone, Medical Disclosures, and Digital Signature checkbox.

- [ ] **Step 3: Create `src/components/CreateNoticeModal.tsx`**
  - Form for title, category, priority, target audience, event date, and consent slip toggle.

- [ ] **Step 4: Create `src/app/notices/page.tsx`**
  - Top statistics: Active Notices, Pending Consents, Upcoming Events.
  - Filter pills: All, Field Trips, Exams, Policies, Urgent.
  - Notice cards with live consent progress bar (`85% Consented - 42/50 Parents`), "Sign Parent Consent" button, and "Publish Circular" button.

---

### Task 4: Navigation, Global CSS & System Verification

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update `src/components/Sidebar.tsx`**
  - Add **EduAI Studio** (`/edu-ai`) with `Sparkles` icon under Academics.
  - Add **Timetable & Substitutes** (`/timetable`) with `Calendar` icon under Academics.
  - Add **Circulars & Notices** (`/notices`) with `Bell` or `Megaphone` icon under Communication.

- [ ] **Step 2: Verify `globals.css`**
  - Ensure print styling hides navigation bars when printing EduAI worksheets or Circulars.

- [ ] **Step 3: End-to-End System Verification**
  - Test EduAI generation and assignment publishing.
  - Test Timetable view switching and substitute auto-recommendation.
  - Test Circular creation and parent consent signing.
