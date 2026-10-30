# Digital School Diary & Assignment Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Build an enterprise-grade **Digital School Diary and Assignment Submission System** for NexEdu ERP. This system bridges two critical educational workflows:
1. **The Daily School Diary (Almanac for Parents & Teachers)**: A daily digital agenda capturing classwork covered, homework tasks, teacher notices, and interactive Parent Signatures / Acknowledgements.
2. **Assignments & Turn-In Studio (Student Submission & Teacher Grading)**: Google Classroom-style assignment distribution, digital student submission with file links/text, and teacher side-by-side grading with evaluation feedback.

---

## File Structure & Responsibilities

| File Path | Responsibility |
|:---|:---|
| `src/app/api/homework/route.ts` | Enhanced API: Handles `GET` (with diary/homework type filters, student submission status, parent sign status) and `POST` (creates assignments or daily diary notes). |
| `src/app/api/homework/[id]/route.ts` | Detailed single homework/diary item API: returns submissions roster, details, and handles deletion. |
| `src/app/api/homework/[id]/submit/route.ts` | Student Turn-in API: creates/updates `AssignmentSubmission` (content, links, late detection). |
| `src/app/api/homework/[id]/grade/route.ts` | Teacher Grading API: awards marks, evaluation feedback, status update. |
| `src/app/api/homework/[id]/sign-diary/route.ts` | Parent Signature API: logs parent digital acknowledgment and notes. |
| `src/components/StudentSubmissionDrawer.tsx` | Slide-over drawer for students: view assignment instructions, write response, submit, view teacher marks/feedback. |
| `src/components/TeacherGradingDrawer.tsx` | Slide-over drawer for teachers: review all submissions, view student work, award scores, write evaluation remarks. |
| `src/app/homework/page.tsx` | Main interface: Segmented tabs for **Daily School Diary** and **Assignments Hub**, filter controls, and Publish Modal. |

---

## Tasks

- [x] **Task 1: Backend APIs for Assignments, Submissions, Grading, and Diary Signatures**
  - [x] Implement enhanced `GET` and `POST` in `src/app/api/homework/route.ts` supporting diary type, classwork notes, and parent note.
  - [x] Implement `src/app/api/homework/[id]/route.ts` for detailed assignment view and deletion.
  - [x] Implement `src/app/api/homework/[id]/submit/route.ts` for student submissions with on-time/late tagging.
  - [x] Implement `src/app/api/homework/[id]/grade/route.ts` for teacher scoring and feedback.
  - [x] Implement `src/app/api/homework/[id]/sign-diary/route.ts` for parent digital signature logging.

- [x] **Task 2: Interactive Student Submission Drawer**
  - [x] Create `src/components/StudentSubmissionDrawer.tsx`.
  - [x] Add instructions, resource links, countdown timer, text editor/link input, and "Turn In Assignment" action.
  - [x] Display graded badge, score breakdown, and teacher feedback card once evaluated.

- [x] **Task 3: Teacher Grading & Evaluation Drawer**
  - [x] Create `src/components/TeacherGradingDrawer.tsx`.
  - [x] Roster overview with submitted vs missing students.
  - [x] Detailed student submission preview, marks input, feedback textarea, and "Return Grade" button.

- [x] **Task 4: Complete UI/UX Overhaul of `src/app/homework/page.tsx`**
  - [x] Add segmented tab bar: **📖 Daily School Diary** and **🎯 Assignments & Tasks**.
  - [x] Daily Diary: Date selector, subject classwork & homework blocks, teacher notices, and parent digital signature panel with signed status indicator.
  - [x] Assignments Hub: Filter pills, card grid with status badges (`PENDING`, `SUBMITTED`, `EVALUATED`, `LATE`), countdowns, and quick actions.
  - [x] "Publish Daily Diary / Assignment" Modal supporting both modes.
