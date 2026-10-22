-- ==============================================================================
-- EDUPARK FIELD PORTAL - SUPABASE POSTGRESQL SEED DATA
-- Realistic sample records for testing batches, dispatches, settlements & excuses
-- ==============================================================================

-- 1. Insert Initial Students
INSERT INTO public.students (id, full_name, batch, phone_number, is_active) VALUES
('a0000000-0000-0000-0000-000000000001', 'Aisha Rahman', 'Batch 2025-A', '+91 98765 43210', true),
('a0000000-0000-0000-0000-000000000002', 'Bilal Ahmed Khan', 'Batch 2025-A', '+91 98765 43211', true),
('a0000000-0000-0000-0000-000000000003', 'Fathima Zahra', 'Batch 2025-A', '+91 98765 43212', true),
('a0000000-0000-0000-0000-000000000004', 'Zayd Hassan', 'Batch 2025-B', '+91 98765 43213', true),
('a0000000-0000-0000-0000-000000000005', 'Mariam Tariq', 'Batch 2025-B', '+91 98765 43214', true),
('a0000000-0000-0000-0000-000000000006', 'Omar Farooq', 'Batch 2025-B', '+91 98765 43215', true),
('a0000000-0000-0000-0000-000000000007', 'Yusuf Ali', 'Batch 2026-A', '+91 98765 43216', true),
('a0000000-0000-0000-0000-000000000008', 'Hiba Nour', 'Batch 2026-A', '+91 98765 43217', true),
('a0000000-0000-0000-0000-000000000009', 'Salman Qureshi', 'Batch 2026-A', '+91 98765 43218', true),
('a0000000-0000-0000-0000-000000000010', 'Khadija Sayeed', 'Batch 2026-B', '+91 98765 43219', true),
('a0000000-0000-0000-0000-000000000011', 'Hamza Idris', 'Batch 2026-B', '+91 98765 43220', true),
('a0000000-0000-0000-0000-000000000012', 'Zainab Mustafa', 'Batch 2026-B', '+91 98765 43221', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Dispatches
-- Dispatch 1: Settled Individual Dispatch
INSERT INTO public.dispatches (id, destination, dispatch_date, target_amount, dispatch_type, status, notes) VALUES
('b0000000-0000-0000-0000-000000000001', 'Green Valley Residency, Sector 4', CURRENT_DATE - INTERVAL '3 days', 5000.00, 'Individual', 'Settled', 'Door to door residential community visit');

INSERT INTO public.dispatch_assignments (id, dispatch_id, student_id, calendars_issued, assignment_status) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 15, 'Settled');

INSERT INTO public.settlements (id, dispatch_assignment_id, cash_amount, gpay_amount, calendars_returned, expenses, settlement_date, notes) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 3200.00, 2400.00, 15, 150.00, CURRENT_DATE - INTERVAL '3 days', 'All 15 calendars distributed or returned; auto fare expense');

-- Dispatch 2: Team Dispatch - Partial Settlement Pending (2 students: 1 settled, 1 pending)
INSERT INTO public.dispatches (id, destination, dispatch_date, target_amount, dispatch_type, status, notes) VALUES
('b0000000-0000-0000-0000-000000000002', 'Metro Commercial Complex & Main Market', CURRENT_DATE - INTERVAL '1 day', 12000.00, 'Team', 'Settlement Pending', 'Commercial hub collection drive');

INSERT INTO public.dispatch_assignments (id, dispatch_id, student_id, calendars_issued, assignment_status) VALUES
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 20, 'Settled'),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 20, 'Dispatched');

INSERT INTO public.settlements (id, dispatch_assignment_id, cash_amount, gpay_amount, calendars_returned, expenses, settlement_date, notes) VALUES
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 4500.00, 3000.00, 18, 200.00, CURRENT_DATE - INTERVAL '1 day', '2 calendars given to major donor shops; receipt verified');

-- Dispatch 3: Active Dispatched Team (3 students: all active, unsettled)
INSERT INTO public.dispatches (id, destination, dispatch_date, target_amount, dispatch_type, status, notes) VALUES
('b0000000-0000-0000-0000-000000000003', 'Sunrise Palm Meadows & Orchid Villas', CURRENT_DATE, 15000.00, 'Team', 'Dispatched', 'Full day field visit to gated township');

INSERT INTO public.dispatch_assignments (id, dispatch_id, student_id, calendars_issued, assignment_status) VALUES
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 25, 'Dispatched'),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005', 25, 'Dispatched'),
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000006', 25, 'Dispatched');

-- 3. Insert Excuses
INSERT INTO public.excuses (id, student_id, excuse_date, reason, notes) VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000007', CURRENT_DATE, 'University Semester Exam', 'Leave approved by Department Dean'),
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000008', CURRENT_DATE, 'Medical Leave / Fever', 'Prescription submitted to administration office');

-- 4. Insert Audit Logs
INSERT INTO public.audit_logs (id, admin_id, action, entity_type, entity_id, details) VALUES
('f0000000-0000-0000-0000-000000000001', 'admin@edupark.edu', 'CREATE_DISPATCH', 'dispatch', 'b0000000-0000-0000-0000-000000000001', '{"destination":"Green Valley Residency","type":"Individual"}'),
('f0000000-0000-0000-0000-000000000002', 'admin@edupark.edu', 'SETTLE_ASSIGNMENT', 'dispatch_assignment', 'c0000000-0000-0000-0000-000000000001', '{"total_collected":5600.00,"expenses":150.00,"net":5450.00}'),
('f0000000-0000-0000-0000-000000000003', 'admin@edupark.edu', 'CREATE_DISPATCH', 'dispatch', 'b0000000-0000-0000-0000-000000000003', '{"destination":"Sunrise Palm Meadows","type":"Team","members":3}');
