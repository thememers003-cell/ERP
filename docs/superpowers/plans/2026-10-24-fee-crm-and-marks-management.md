# Fee CRM Billing Suite & Marks Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Implement the **Fee CRM Billing Suite** (with student search auto-import, Monthly/Term/Yearly billing frequencies, and printable official receipts) and the **Academic Marks Entry & Transcript Hub** (with spreadsheet marks entry, live letter grading, and student report card views) in NexEdu ERP.

---

## File Structure & Responsibilities

| File Path | Responsibility |
|:---|:---|
| `src/app/api/fees/invoices/route.ts` | API to create new fee invoices with cadence (`MONTHLY`, `TERM_WISE`, `YEARLY`, `ONE_TIME`), category, and target student. |
| `src/app/api/fees/receipt/[id]/route.ts` | API to retrieve structured receipt data for printing official payment vouchers. |
| `src/app/api/exams/marks/route.ts` | API to batch upsert marks, letter grades, and teacher remarks for an exam subject schedule. |
| `src/components/ReceiptModal.tsx` | High-fidelity printable institutional fee receipt modal with print styles, school crest, and receipt numbering. |
| `src/app/fees/page.tsx` | Main Fee CRM UI: CRM student search bar, cadence tabs (Monthly, Term, Yearly), Create Invoice Modal, and Payment Collection with Receipt trigger. |
| `src/app/exams/page.tsx` | Main Exams & Marks UI: Teacher rapid marks entry grid with auto-computed letter grades (`A*` to `F`), pass/fail tags, and Student visual transcript report card. |

---

## Tasks

- [x] **Task 1: Backend APIs for Invoicing & Official Receipts**
  - [x] Implement `src/app/api/fees/invoices/route.ts` supporting frequency (`MONTHLY`, `TERM_WISE`, `YEARLY`), category, and student targeting.
  - [x] Implement `src/app/api/fees/receipt/[id]/route.ts` returning receipt voucher metadata.

- [x] **Task 2: Backend API for Batch Marks Entry & Grades**
  - [x] Implement `src/app/api/exams/marks/route.ts` with auto-grade computation (`A*`, `A`, `B`, `C`, `D`, `F`) and batch upsert.

- [x] **Task 3: Official Printable Receipt Component**
  - [x] Create `src/components/ReceiptModal.tsx` with print layout, school crest, breakdown of fees, payment method, and 1-click Print / Save PDF.

- [x] **Task 4: Fee CRM Billing Suite Overhaul (`src/app/fees/page.tsx`)**
  - [x] Add CRM Student search bar (by name, roll #, admission #) with auto-suggest and student data auto-import.
  - [x] Add cadence filters: *All Invoices*, *Monthly Tuition*, *Term-wise Fees*, *Annual Dues*, *Overdue*.
  - [x] Add "Generate Fee Invoice" Modal with cadence picker.
  - [x] Connect Collect Payment to open the Printable Receipt Modal upon payment.

- [x] **Task 5: Academic Marks Entry & Transcript Hub (`src/app/exams/page.tsx`)**
  - [x] Build Teacher Rapid Marks Entry Grid with real-time letter grade calculation, remarks input, and batch save.
  - [x] Build Student & Parent Transcript View with exam score breakdowns, percentage progress bars, and teacher appraisal notes.
