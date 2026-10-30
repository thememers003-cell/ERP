# Design Specification: EduAI Studio, Smart Timetable with Auto-Substitute Dispatch, and Circulars with Parent Consent

**Date**: 2026-10-24  
**Author**: Antigravity Assistant & NexEdu ERP Team  
**Scope**: Project (3 core modules)  
**Status**: Pending User Approval  

---

## 1. Intent & The "Why"
Modern K-12 school operations face three constant administrative bottlenecks:
1. **Teacher Workload & Content Creation**: Crafting differentiated lesson plans, rubrics, and quizzes takes hours of manual drafting outside class time.
2. **Morning Substitution Crisis**: When a teacher calls in sick, administrators scramble to cross-reference paper timetables to find free teachers, causing classroom disruptions.
3. **Parent Communication & Consent Friction**: Paper circulars and permission slips for school trips and events get lost in student backpacks, resulting in incomplete parent acknowledgments and lack of audit trails.

This project delivers three tightly integrated modules within NexEdu ERP to eliminate these friction points.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **EduAI Studio (`/edu-ai`)**:
  - Interactive lesson planning generator for any subject, grade, and board (CBSE, ICSE, Cambridge, IB).
  - Generates 45-minute structured period timelines, learning objectives, vocabulary keys, and differentiated activities.
  - Generates 5-to-10 question interactive quizzes (MCQ + Short Answer) with an answer key and scoring rubric.
  - Direct 1-click **"Publish to Assignments"** action that creates an assignment directly in the existing Homework Hub (`/homework`) and database.
  - 1-click printable worksheet view with student name/roll number header.
- **Smart Timetable & Auto-Substitute Dispatch (`/timetable`)**:
  - Interactive weekly period timetable matrix (Monday–Friday, Periods 1–8).
  - Dual-mode view: **By Class & Section** (e.g., Grade 9-A, 10-A, 10-B) and **By Teacher** (e.g., Mr. Rajesh Sharma, Ms. Anita Patel).
  - Quick **"Report Teacher Absence"** modal that automatically identifies all periods where the absent teacher is scheduled, scans for teachers with free slots during those exact periods, ranks the best substitutes, and updates the timetable with a highlighted `SUBSTITUTE` tag in 1 click.
- **Circulars & Parent Consent Hub (`/notices`)**:
  - Formatted circular publishing system with tags (`FIELD_TRIP`, `EXAM_SCHEDULE`, `GENERAL_POLICY`, `EMERGENCY`).
  - Target audience selector (`ALL_SCHOOL`, `CLASS_SPECIFIC`, `PARENTS_ONLY`, `STAFF_ONLY`).
  - Interactive **Digital Parent Consent Slip** for event/field trip circulars with live statistics: `Consent Given`, `Pending Response`, and `Declined`.
  - Parent simulated consent dialog allowing parents to review safety notes, medical disclosures, and digitally sign/acknowledge consent.

### Non-Goals
- Real-time WebRTC live video streaming (handled by external tools like Zoom/Google Meet if needed).
- Complex automated master schedule generation algorithm (genetic algorithm constraint solver across 1,000s of variables) in this phase; we focus on interactive timetable view and automatic substitution resolution.

### Anti-Goals
- Requiring heavy cloud AI API keys (OpenAI/Anthropic) to test the app locally; we provide high-quality embedded prompt-engineering engines and instant simulated generation templates that work seamlessly offline, with clean plug-in hooks for live LLM keys if desired.
- Breaking existing Prisma database migrations. We leverage clean API endpoints and dedicated local persistence structures to keep the build rock solid.

---

## 3. Approaches Considered & Trade-Offs

### Approach A (Selected): Integrated Enterprise Suite with Cross-Module Wiring
- Dedicated routes (`/edu-ai`, `/timetable`, `/notices`), linked directly into existing Sidebar navigation.
- EduAI publishes directly to Homework Hub (`/homework`), Timetable links to Teacher profiles (`/teachers`), and Circulars link to Parent/Student rosters.
- *Trade-off*: Requires three synchronized UI screens and APIs, but delivers the most authentic, cohesive enterprise experience.

### Approach B: Single Monolithic "Academic Operations" Mega-Dashboard (`/academic-ops`)
- Combines all three features into a single tabbed page.
- *Trade-off*: Saves sidebar items, but mixes disparate staff roles into an overly crowded UI.

### Approach C: Isolated Standalone Pages without Cross-System Wiring
- Simple independent pages without direct links to homework or teacher rosters.
- *Trade-off*: Simpler code, but disjointed user experience.

---

## 4. Architectural & UI Design

### 4.1 EduAI Studio (`/edu-ai`)
- **Top Bar**: Subject picker (Mathematics, Science, English, Social Studies, Computer Science), Grade/Class selector, Curriculum framework (CBSE, ICSE, Cambridge, IB), and Lesson Topic input.
- **Generator Mode Tabs**:
  - `📖 Lesson Plan Generator`: Produces Objectives, Prior Knowledge, 45-min Period Breakdown (Warm-up, Direct Instruction, Guided Practice, Exit Ticket), and Assessment Questions.
  - `📝 Quiz & Rubric Generator`: Generates Question Bank, Multiple Choice with options & correct answers, Short Answer with grading rubrics.
- **Action Bar**:
  - `🚀 Publish to Assignments`: Opens modal pre-filled with the AI quiz/lesson as homework, selecting class and due date, directly calling `/api/homework`.
  - `🖨️ Print / Save Worksheet`: Clean printable layout without UI toolbars.

### 4.2 Smart Timetable & Auto-Substitute Dispatch (`/timetable`)
- **Top Controls**: Filter by Class (10-A, 10-B, 9-A) OR Filter by Teacher. Weekday picker (Mon-Fri) or full weekly view.
- **Timetable Matrix**: 8 standard school periods (Period 1 to Period 8) + Lunch Break. Each cell displays Subject, Teacher Name, Room Number, and Status badge (`Normal`, `Substituted`, `Special Lab`).
- **Emergency Substitute Engine**:
  - Button: `🚨 Report Absence & Find Substitute`.
  - Teacher selection & Date.
  - System dynamically analyzes period timetable data, finds free teachers with zero period clashes, and displays "Recommended Substitutes" with their current workload.
  - 1-click `Confirm Substitution` updates the slot live and displays a notification banner.

### 4.3 Circulars & Parent Consent Hub (`/notices`)
- **Dashboard Stats**: Active Circulars, Upcoming Events, Total Consents Awaiting Action.
- **Notice Cards**:
  - Card with Priority Badge (`URGENT`, `HIGH`, `NORMAL`), Category, Title, Issue Date, Attachment link, and Target Audience.
  - For Field Trips/Events: Inline **Consent Tracker** progress bar (`84% Consented - 42/50 Parents`).
  - Action: `Preview Notice & Sign Consent` opens a high-fidelity modal simulating the parent view with emergency contact input, health remarks, and digital signature acknowledgment.
- **Publish Notice Modal**: Admin/Principal interface to draft a new circular with optional consent slip enablement.

### 4.4 Navigation Updates
- Update `src/components/Sidebar.tsx` to include:
  - 🤖 **EduAI Studio** (`/edu-ai`) under Academics
  - ⚡ **Timetable & Substitutes** (`/timetable`) under Academics
  - 📢 **Circulars & Notices** (`/notices`) under Communication

---

## 5. Verification Plan
- Verify `/edu-ai` loads smoothly, generates curriculum-aligned lesson plans and quizzes, and can publish directly to `/homework`.
- Verify `/timetable` switches between Class and Teacher views, and clicking "Report Absence" accurately recommends free teachers and updates substituted periods.
- Verify `/notices` displays notices, filters by category, allows drafting new circulars, and allows submitting digital parent consent with updated progress bars.
- Ensure all responsive layouts, modals, print styles, and dark-mode styles adhere to the design system.
