-- =============================================================================
-- TASK-009: Seed initial leave types and local development data
-- File: seed.sql
-- =============================================================================
-- Idempotent: every INSERT uses ON CONFLICT DO NOTHING against a stable,
-- naturally-unique target (leave_types.name, profiles.id via fixed UUIDs,
-- leave_balances(employee_id, leave_type, year)). Running `supabase db reset`
-- any number of times must produce no errors and no duplicate rows.


-- -----------------------------------------------------------------------------
-- Step 1: Leave types (four, exactly as specified — no extras)
-- -----------------------------------------------------------------------------

INSERT INTO public.leave_types (name, default_days, allow_carryover, is_active) VALUES
  ('Annual Leave',    15, false, true),
  ('Sick Leave',      15, false, true),
  ('Emergency Leave',  3, false, true),
  ('Unpaid Leave',     0, false, true)
ON CONFLICT (name) DO NOTHING;


-- -----------------------------------------------------------------------------
-- Step 2: Profiles (five, fixed UUIDs for reproducibility)
--   1 manager -> 2 employees (manager_id points at the manager) -> 1 HR Admin
--   -> 1 Sys Admin. In production, profiles.id must match auth.users.id via
--   the TASK-012 trigger; for local seed data we assign fixed UUIDs directly.
-- -----------------------------------------------------------------------------

-- Manager
INSERT INTO public.profiles (id, email, full_name, role, manager_id, department) VALUES
  ('11111111-1111-1111-1111-111111111111', 'manager@stratpoint.com', 'Alice Manager', 'manager', NULL, 'Engineering')
ON CONFLICT (id) DO NOTHING;

-- Employees reporting to the manager above
INSERT INTO public.profiles (id, email, full_name, role, manager_id, department) VALUES
  ('22222222-2222-2222-2222-222222222222', 'employee1@stratpoint.com', 'Bob Employee',   'employee', '11111111-1111-1111-1111-111111111111', 'Engineering'),
  ('33333333-3333-3333-3333-333333333333', 'employee2@stratpoint.com', 'Carol Employee', 'employee', '11111111-1111-1111-1111-111111111111', 'Engineering')
ON CONFLICT (id) DO NOTHING;

-- HR Admin
INSERT INTO public.profiles (id, email, full_name, role, manager_id, department) VALUES
  ('44444444-4444-4444-4444-444444444444', 'hr@stratpoint.com', 'Dana HRAdmin', 'hr_admin', NULL, 'HR')
ON CONFLICT (id) DO NOTHING;

-- Sys Admin
INSERT INTO public.profiles (id, email, full_name, role, manager_id, department) VALUES
  ('55555555-5555-5555-5555-555555555555', 'sysadmin@stratpoint.com', 'Evan SysAdmin', 'sys_admin', NULL, 'IT')
ON CONFLICT (id) DO NOTHING;


-- -----------------------------------------------------------------------------
-- Step 3: Leave balances for the current calendar year
--   One row per (test employee, leave type) with non-zero total_days, matching
--   each leave_type's default_days. used_days varies to exercise both
--   untouched and partially-consumed balances in local testing.
-- -----------------------------------------------------------------------------

INSERT INTO public.leave_balances (employee_id, leave_type, year, total_days, used_days) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Annual Leave',    EXTRACT(YEAR FROM CURRENT_DATE)::INT, 15, 3),
  ('22222222-2222-2222-2222-222222222222', 'Sick Leave',      EXTRACT(YEAR FROM CURRENT_DATE)::INT, 15, 0),
  ('22222222-2222-2222-2222-222222222222', 'Emergency Leave', EXTRACT(YEAR FROM CURRENT_DATE)::INT,  3, 0),
  ('22222222-2222-2222-2222-222222222222', 'Unpaid Leave',    EXTRACT(YEAR FROM CURRENT_DATE)::INT,  0, 0),

  ('33333333-3333-3333-3333-333333333333', 'Annual Leave',    EXTRACT(YEAR FROM CURRENT_DATE)::INT, 15, 5),
  ('33333333-3333-3333-3333-333333333333', 'Sick Leave',      EXTRACT(YEAR FROM CURRENT_DATE)::INT, 15, 2),
  ('33333333-3333-3333-3333-333333333333', 'Emergency Leave', EXTRACT(YEAR FROM CURRENT_DATE)::INT,  3, 0),
  ('33333333-3333-3333-3333-333333333333', 'Unpaid Leave',    EXTRACT(YEAR FROM CURRENT_DATE)::INT,  0, 0)
ON CONFLICT (employee_id, leave_type, year) DO NOTHING;
