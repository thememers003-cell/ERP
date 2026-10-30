# NexEdu ERP: Fee CRM Billing Suite & Academic Marks Management Design Specification

## 1. Intent & Purpose
Enable school administrators and accountants to manage institutional fees with CRM-speed search and flexible billing cadences (Monthly, Term-wise, Yearly, One-time), generate printable tax receipts, and give teachers and students an interactive Marks Entry and Gradebook inspection system.

---

## 2. Goals & Non-Goals

### Goals
- **CRM Student Search & Fee Generation**:
  - Live fuzzy search by Student Name, Admission Number, Roll Number, or Class dropdown.
  - Auto-import student data (Name, Admission #, Class/Section, Parent contact) into invoice generation.
  - Frequency selector: `MONTHLY`, `TERM_WISE`, `YEARLY`, `ONE_TIME`.
  - Official Printable Payment Receipt modal with school branding, receipt #, timestamp, payment method (UPI, Card, Bank, Cash), breakdown, and print action.
- **Academic Marks Entry & Gradebook**:
  - Teacher Marks Entry Grid: Pick an Exam Schedule, view enrolled students roster, type marks obtained out of maxMarks, see live computed letter grades (`A*` to `F`), add remarks, and batch save.
  - Student & Parent Transcripts: Detailed view of all examinations, subject performance breakdown, percentage progress bars, GPA estimate, and teacher appraisal remarks.

### Non-Goals
- Real money gateway transactions (Stripe/Razorpay test keys can be added later; current focus is accounting records, invoices, and official receipt vouchers).

---

## 3. Approaches Considered
- **Approach A (Selected)**: Native Next.js Financial Ledger with CRM student autocompletion + Live Marks Spreadsheet Grid with instant grade calculation and printable receipts.
- **Approach B**: CSV download/upload for marks and external hosted payment links. *Dropped because it creates manual file shuffle and friction for daily classroom grading.*

---

## 4. Architectural & Component Plan

### A. Backend API Routes
1. `src/app/api/fees/invoices/route.ts`:
   - `POST`: Creates new fee invoice for a specific student or bulk class with frequency (`MONTHLY`, `TERM_WISE`, `YEARLY`, `ONE_TIME`), category (Tuition, Transport, Lab, Annual), amount, and due date.
2. `src/app/api/fees/receipt/[id]/route.ts`:
   - `GET`: Returns printable receipt voucher details (Receipt #, Invoice #, Student details, School info, Paid amount, Balance, Payment method, Transaction ref).
3. `src/app/api/exams/marks/route.ts`:
   - `POST`: Batch upsert marks obtained, grade, and remarks for multiple students in an exam schedule.

### B. Frontend Views & Components
1. **Fee CRM & Billing Suite** ([`src/app/fees/page.tsx`](file:///c:/Users/ADMIN/Desktop/SCHOOL%20ERP/src/app/fees/page.tsx)):
   - **CRM Search Bar**: Instant search across all students by name, roll #, or admission # with auto-suggest dropdown.
   - **Frequency Filters & Invoices Table**: Tabs for *All Invoices*, *Monthly Tuition*, *Term Fees*, *Annual Dues*, and *Overdue Accounts*.
   - **"Create Invoice" Modal**: Select student via CRM search, select cadence (`MONTHLY`, `TERM_WISE`, `YEARLY`), category, amount, due date.
   - **Printable Receipt Modal** (`ReceiptModal.tsx`): Institutional receipt voucher with print button and stamp preview.
2. **Marks Entry & Gradebook** ([`src/app/exams/page.tsx`](file:///c:/Users/ADMIN/Desktop/SCHOOL%20ERP/src/app/exams/page.tsx)):
   - **Teacher Marks Entry Tab**: Pick Exam & Subject, see student roster with roll #, input marks with live auto-grading (`A*`, `A`, `B`, `C`, `D`, `F`), pass/fail badges, and "Save Marks" action.
   - **Student & Parent Transcript Tab**: Visual report card breakdown, subject mastery bars, total percentage, and teacher remarks.

---

## 5. Verification & Acceptance Criteria
- [ ] Searching student name in Fee CRM auto-populates their details and unbilled dues.
- [ ] Issuing an invoice with frequency (Monthly/Term/Yearly) creates database record and reflects in student fee balance.
- [ ] Collecting payment opens an official printable receipt modal with receipt number and print styles.
- [ ] Teachers can input marks for students, see live grade calculation, and batch-save to the database.
- [ ] Students/parents see their marks, letter grades, and percentages on the Gradebook screen.
