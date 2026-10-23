# Edupark Field Portal

A full-stack, production-ready web application for campus administration to manage students visiting field destinations to collect donations, track physical calendars, and process individual and team settlements.

> **Single Portal Policy**: This system is designed with **ONLY ONE PORTAL: ADMIN PORTAL**. There is no student portal, teacher portal, or public registration. All routes and operations are strictly protected for authorized administrators.

---

## 1. Key Features

- **Admin Authentication**:
  - Secure credential verification.
  - Supports Supabase Auth or configured admin credentials.
  - Show/hide password control.
  - Session persistence with quick logout.

- **Admin Dashboard**:
  - **Card 1: Dispatched Students**: Unique students currently assigned to active unsettled field dispatches.
  - **Card 2: Total Amount Collected**: Money received through finalized settlements with distinction from pending target collections.
  - **Card 3: Excused Students**: Unique students officially excused for the selected period.
  - **Card 4: Total Registered Students**: All active students in the database.
  - Operational statistics: Active dispatches, completed settlements, pending duty, calendars issued, returned, and outstanding.
  - Treasury banner: Net collection formula (`Total Collected - Expenses`).
  - Interactive Recharts: Batch contribution bar chart & Cash vs. UPI payment breakdown donut chart.
  - Real-time audit trail activity log.

- **Student Management**:
  - Complete CRUD: Add, edit, search, filter, and archive/deactivate students.
  - Batch / cohort tracking and phone number support.
  - Prevents breaking historical records: Deactivates students while preserving past dispatches, settlements, and collections.
  - Dynamic status indicator (`Available`, `Dispatched`, `Settlement Pending`, `Excused`, `Inactive`).
  - Search by name, batch, or phone number.
  - Print & Export to CSV, Excel, and PDF.

- **Dispatch Coordination**:
  - Individual vs Team classification: Automatically classifies dispatches (1 student = Individual; 2+ students = Team).
  - Multi-student selector with live search.
  - Per-student physical calendar allotment.
  - Conflict checking: Prevents conflicting assignments if a student is already dispatched or excused on that date.
  - Section to record student exemptions/excuses during dispatch creation.
  - Expandable team drawer showing each member's assigned calendars, collection amount, and settlement status.

- **Settlement Workflow**:
  - Settle team members independently (e.g. 1 of 3 settled updates dispatch to `Settlement Pending`).
  - When all members settle, the dispatch automatically transitions to `Settled`.
  - Live calculations:
    - `Total Collected = Cash Collected + GPay/UPI Collected`
    - `Net Collection = Total Collected - Expenses`
    - `Outstanding Calendars = Calendars Issued - Calendars Returned`
  - Validations:
    - Non-negative amounts.
    - Returned calendars cannot exceed issued quantity.
    - Prevents double settlement.
  - Printable Settlement Receipt with itemized breakdown and student/admin signature lines.

- **Excused Students Management**:
  - Track exemptions with date, reason (Medical, Exam, Department duty), and admin notes.
  - Conflict prevention: Students excused on a date cannot be dispatched on the same date.

- **Physical Calendar Inventory**:
  - Track calendars issued, returned, and outstanding across individual assignments and teams.
  - Strict reconciliation preventing negative or inflated returns.

- **Export & Reports Hub (12 Reports)**:
  1. Student List
  2. Dispatch Register
  3. Individual Student Dispatch History
  4. Team Dispatch Report
  5. Settlement Register
  6. Cash Collection Report
  7. GPay / UPI Collection Report
  8. Expenses Report
  9. Net Collection Report
  10. Excused Students Report
  11. Physical Calendar Inventory Report
  12. Outstanding Settlement Report
  - Format options: Clean A4 Print view (hides navigation/buttons, repeats table headers), CSV with UTF-8 BOM, Excel-compatible `.xls`, and client-side PDF.

---

## 2. Technology Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (Navy Blue `#0F172A`, Sky Blue `#0284C7`, Emerald Green `#10B981`, Amber `#F59E0B`, Rose Red `#EF4444`)
- **Icons**: Lucide React
- **Backend & Database**: Supabase PostgreSQL with Row Level Security (RLS) policies and triggers
- **Dual-Storage Engine**: Connects to live Supabase PostgreSQL when credentials are configured; otherwise provides persistent local storage with full relational integrity and test data.
- **Reporting Engine**: `jspdf`, `jspdf-autotable`, and print-optimized `@media print` CSS.
- **Charts**: Recharts

---

## 3. Quick Start & Local Setup

### Prerequisites
- Node.js (v18 or higher; tested on v24)
- npm (v9 or higher)

### Installation
1. Clone or open the repository:
   ```bash
   cd "e:/Field Portal"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. Run automated tests:
   ```bash
   npm test
   ```

---

## 4. Default Administrator Credentials

When running in local mode (or before Supabase Auth users are created):
- **Username / Email**: `admin` (or `admin@edupark.edu`)
- **Password**: `edupark@admin2025`

These credentials can be changed in your `.env` file via:
```env
VITE_ADMIN_DEFAULT_USERNAME=your_admin_username
VITE_ADMIN_DEFAULT_PASSWORD=your_secure_password
```

---

## 5. Supabase Setup & Database Migration

To connect to a live Supabase PostgreSQL database:

1. Create a new project in your [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor** in Supabase.
3. Copy the contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it. This creates:
   - All tables (`students`, `dispatches`, `dispatch_assignments`, `settlements`, `excuses`, `audit_logs`).
   - Indexes and constraints.
   - Validation triggers (e.g. `calendars_returned <= calendars_issued`).
   - Auto-settle triggers (updates team dispatch status when members settle).
   - Row Level Security (RLS) policies.
4. *(Optional)* Run [`supabase/seed.sql`](./supabase/seed.sql) to populate initial sample batches, students, dispatches, and settlements.
5. Create an administrator user in **Authentication -> Users** in Supabase (e.g. `admin@edupark.edu`).
6. Copy your Project URL and Anon Public Key from **Project Settings -> API**.
7. Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
8. Restart your Vite dev server (`npm run dev`). The portal header badge will immediately show **Supabase Live**.

---

## 6. Vercel Deployment Instructions

1. Push this repository to GitHub or GitLab.
2. In [Vercel](https://vercel.com), click **Add New -> Project** and import the repository.
3. Configure the build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_DEFAULT_USERNAME`
   - `VITE_ADMIN_DEFAULT_PASSWORD`
5. Click **Deploy**. Your Edupark Field Portal is now live and production-ready!

---

## 7. Business Rules Enforced

1. **Individual vs. Team**: Selecting exactly 1 student creates an Individual dispatch; selecting 2 or more creates a Team dispatch with a shared parent dispatch and individual assignment records.
2. **Team Member Independence**: Settling one member of a team does not settle other members. The dispatch remains in `Settlement Pending` until all members settle.
3. **Calendar Return Constraints**: A student cannot return more calendars than were issued to them.
4. **Conflict Prevention**: A student cannot be assigned to multiple active dispatches on the same date, nor can a student be marked excused and dispatched on the same date.
5. **Historical Integrity**: Students cannot be deleted if historical records exist; archiving deactivates them from future dispatches while preserving past audit trails.
6. **Financial Reconciliations**: `Total Collected = Cash + GPay/UPI` and `Net Collection = Total Collected - Expenses`.
#   E D U P A R K - F I E L D - P O R T A L  
 