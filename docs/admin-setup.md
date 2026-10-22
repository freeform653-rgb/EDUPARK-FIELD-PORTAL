# Administrator Setup & Security Guide

This document describes how to configure administrators, provision Supabase Auth users, manage security policies, and operate the Edupark Field Portal.

## 1. Single Portal Philosophy

The Edupark Field Portal is strictly an **internal management system**.
- **Only one portal exists: The Admin Portal.**
- Public self-registration is disabled.
- Student login, student dashboards, and teacher portals are non-existent by design.
- All application routes (`/dashboard`, `/students`, `/dispatches`, `/settle`, `/exports`) are guarded and redirect unauthenticated users to `/login`.

## 2. Setting Up the Initial Administrator Account

### Method A: Local Mode (Instant Out-of-the-Box)
The application comes pre-configured for local administrative access.
- Username: `admin` (or `admin@edupark.edu`)
- Password: `edupark@admin2025`

To change these credentials locally, edit or create `.env`:
```env
VITE_ADMIN_DEFAULT_USERNAME=your_chosen_username
VITE_ADMIN_DEFAULT_PASSWORD=your_chosen_password
```

### Method B: Supabase Auth (Production Cloud Deployment)
1. In your Supabase Dashboard, navigate to **Authentication -> Users**.
2. Click **Add User -> Create User**.
3. Enter:
   - Email: `admin@edupark.edu` (or your campus domain email)
   - Password: A strong, secure password
   - Auto Confirm User: **Enabled**
4. Set User Metadata (optional):
   ```json
   {
     "name": "Head of Campus Field Operations",
     "role": "admin"
   }
   ```
5. On the Edupark Field Portal login screen, the admin can now enter `admin@edupark.edu` and their password to authenticate directly via Supabase Auth.

## 3. Database Security & Row Level Security (RLS)

All tables in `supabase/schema.sql` have Row Level Security enabled:
```sql
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
```

Policies grant full access to authenticated admin users (`TO authenticated`). Never expose the Supabase service-role secret key to the frontend client. Only the public `anon` key is used in frontend environment variables.

## 4. Resetting Sample Records

When running in Local Storage Mode, you can reset all records back to the clean initial seed data at any time:
1. Look at the bottom of the left sidebar.
2. Click **Reset Demo Data**.
3. Confirm the prompt. The application will immediately re-initialize the baseline students, batches, dispatches, settlements, and calendar counts.
