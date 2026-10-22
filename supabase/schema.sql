-- ==============================================================================
-- EDUPARK FIELD PORTAL - SUPABASE POSTGRESQL SCHEMA
-- Production database schema with tables, constraints, indexes, triggers & RLS
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. STUDENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    batch TEXT NOT NULL,
    phone_number TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_student_name_not_empty CHECK (char_length(trim(full_name)) > 0),
    CONSTRAINT chk_student_batch_not_empty CHECK (char_length(trim(batch)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students(batch);
CREATE INDEX IF NOT EXISTS idx_students_full_name ON public.students(full_name);
CREATE INDEX IF NOT EXISTS idx_students_active ON public.students(is_active);

-- ------------------------------------------------------------------------------
-- 2. DISPATCHES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination TEXT NOT NULL,
    dispatch_date DATE NOT NULL,
    target_amount NUMERIC(12, 2) DEFAULT 0 CHECK (target_amount >= 0),
    dispatch_type TEXT NOT NULL CHECK (dispatch_type IN ('Individual', 'Team')),
    status TEXT NOT NULL DEFAULT 'Dispatched' CHECK (status IN ('Dispatched', 'Settlement Pending', 'Settled', 'Cancelled')),
    notes TEXT,
    created_by TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_destination_not_empty CHECK (char_length(trim(destination)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_dispatches_date ON public.dispatches(dispatch_date);
CREATE INDEX IF NOT EXISTS idx_dispatches_status ON public.dispatches(status);
CREATE INDEX IF NOT EXISTS idx_dispatches_destination ON public.dispatches(destination);

-- ------------------------------------------------------------------------------
-- 3. DISPATCH ASSIGNMENTS TABLE (Relational bridge for Individual & Team)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dispatch_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_id UUID NOT NULL REFERENCES public.dispatches(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    calendars_issued INTEGER NOT NULL DEFAULT 0 CHECK (calendars_issued >= 0),
    assignment_status TEXT NOT NULL DEFAULT 'Dispatched' CHECK (assignment_status IN ('Dispatched', 'Settled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_dispatch_student UNIQUE (dispatch_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_dispatch ON public.dispatch_assignments(dispatch_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON public.dispatch_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.dispatch_assignments(assignment_status);

-- ------------------------------------------------------------------------------
-- 4. SETTLEMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_assignment_id UUID NOT NULL UNIQUE REFERENCES public.dispatch_assignments(id) ON DELETE RESTRICT,
    cash_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (cash_amount >= 0),
    gpay_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (gpay_amount >= 0),
    calendars_returned INTEGER NOT NULL DEFAULT 0 CHECK (calendars_returned >= 0),
    expenses NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (expenses >= 0),
    total_collected NUMERIC(12, 2) GENERATED ALWAYS AS (cash_amount + gpay_amount) STORED,
    net_collection NUMERIC(12, 2) GENERATED ALWAYS AS ((cash_amount + gpay_amount) - expenses) STORED,
    settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settlements_assignment ON public.settlements(dispatch_assignment_id);
CREATE INDEX IF NOT EXISTS idx_settlements_date ON public.settlements(settlement_date);

-- ------------------------------------------------------------------------------
-- 5. EXCUSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.excuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    excuse_date DATE NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    created_by TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_student_excuse_date UNIQUE (student_id, excuse_date),
    CONSTRAINT chk_excuse_reason_not_empty CHECK (char_length(trim(reason)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_excuses_date ON public.excuses(excuse_date);
CREATE INDEX IF NOT EXISTS idx_excuses_student ON public.excuses(student_id);

-- ------------------------------------------------------------------------------
-- 6. AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 7. TRIGGERS & BUSINESS LOGIC ENFORCEMENT
-- ------------------------------------------------------------------------------

-- Trigger 1: Enforce returned calendars cannot exceed issued calendars
CREATE OR REPLACE FUNCTION public.fn_validate_settlement_calendars()
RETURNS TRIGGER AS $$
DECLARE
    v_issued INT;
BEGIN
    SELECT calendars_issued INTO v_issued
    FROM public.dispatch_assignments
    WHERE id = NEW.dispatch_assignment_id;

    IF NEW.calendars_returned > v_issued THEN
        RAISE EXCEPTION 'Returned calendars (%) cannot exceed issued calendars (%) for this assignment',
            NEW.calendars_returned, v_issued;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_settlement_calendars ON public.settlements;
CREATE TRIGGER trg_validate_settlement_calendars
BEFORE INSERT OR UPDATE ON public.settlements
FOR EACH ROW EXECUTE FUNCTION public.fn_validate_settlement_calendars();

-- Trigger 2: Automatically mark assignment and parent dispatch as settled
CREATE OR REPLACE FUNCTION public.fn_handle_settlement_completed()
RETURNS TRIGGER AS $$
DECLARE
    v_dispatch_id UUID;
    v_total_assignments INT;
    v_settled_assignments INT;
BEGIN
    -- Update assignment status to Settled
    UPDATE public.dispatch_assignments
    SET assignment_status = 'Settled'
    WHERE id = NEW.dispatch_assignment_id
    RETURNING dispatch_id INTO v_dispatch_id;

    -- Count total vs settled assignments for this dispatch
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE assignment_status = 'Settled')
    INTO v_total_assignments, v_settled_assignments
    FROM public.dispatch_assignments
    WHERE dispatch_id = v_dispatch_id;

    -- Update parent dispatch status
    IF v_settled_assignments = v_total_assignments THEN
        UPDATE public.dispatches
        SET status = 'Settled', updated_at = now()
        WHERE id = v_dispatch_id;
    ELSIF v_settled_assignments > 0 THEN
        UPDATE public.dispatches
        SET status = 'Settlement Pending', updated_at = now()
        WHERE id = v_dispatch_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handle_settlement_completed ON public.settlements;
CREATE TRIGGER trg_handle_settlement_completed
AFTER INSERT ON public.settlements
FOR EACH ROW EXECUTE FUNCTION public.fn_handle_settlement_completed();

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins full access
CREATE POLICY "Admins full access to students" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access to dispatches" ON public.dispatches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access to assignments" ON public.dispatch_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access to settlements" ON public.settlements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access to excuses" ON public.excuses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins full access to audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow anon access for internal single-portal mode if configured with anon key
CREATE POLICY "Anon full access to students" ON public.students FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access to dispatches" ON public.dispatches FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access to assignments" ON public.dispatch_assignments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access to settlements" ON public.settlements FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access to excuses" ON public.excuses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access to audit_logs" ON public.audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);
