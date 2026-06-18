-- =============================================================================
-- TASK-011: RLS policies for all business tables
-- Migration: 20260519000002_rls_policies.sql
-- =============================================================================
--
-- HARD PREREQUISITE: This migration defines get_user_role(), which reads
-- profiles.role. That column is populated by the handle_new_user() trigger
-- created in TASK-012 (20260519000003_profiles_trigger.sql).
--
-- Required apply order: 000001 → 000002 → 000003
--
-- Applying 000002 without subsequently applying 000003 will cause
-- get_user_role() to return NULL for every authenticated user — all role
-- checks across every policy will fail, locking out all users from all tables.
--
-- The profiles(manager_id) index required by the Manager direct-reports
-- subquery is confirmed present from TASK-008 (000001_initial_schema.sql).

-- RISK ACCEPTANCE: service_role carries BYPASSRLS and ignores these policies.
-- Mitigated by AGENTS.md: service role key is server-side only, never in
-- the client bundle. No application code exposes service_role to users.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Step 1: SECURITY DEFINER helper — safe role lookup without recursive RLS
-- -----------------------------------------------------------------------------
-- Runs as function owner (postgres/superuser), bypassing RLS on profiles.
-- Prevents a recursive RLS loop when policies on profiles check the caller's
-- role. Called in every non-trivial USING / WITH CHECK expression.

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


-- -----------------------------------------------------------------------------
-- Step 2: Enable RLS — all five business tables
-- -----------------------------------------------------------------------------

ALTER TABLE public.leave_types    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log      ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- Step 3: Policies — leave_types
-- =============================================================================
-- Sys Admin: no access (profiles only per task spec).
-- Employee: active, non-deleted types only.
-- Manager + HR Admin: all non-deleted types (may need to see inactive types).
-- No INSERT policy for any role — leave types are seeded; creation is out of
-- scope for TASK-011.

CREATE POLICY "employee_select_leave_types"
  ON public.leave_types
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'employee'
    AND is_active = true
    AND deleted_at IS NULL
  );

CREATE POLICY "manager_select_leave_types"
  ON public.leave_types
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'manager'
    AND deleted_at IS NULL
  );

CREATE POLICY "hr_admin_select_leave_types"
  ON public.leave_types
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'hr_admin'
    AND deleted_at IS NULL
  );

CREATE POLICY "hr_admin_update_leave_types"
  ON public.leave_types
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role() = 'hr_admin'
    AND deleted_at IS NULL
  )
  WITH CHECK (public.get_user_role() = 'hr_admin');

-- DELETE blocked — explicit per-role denial
CREATE POLICY "block_delete_leave_types_employee"
  ON public.leave_types
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "block_delete_leave_types_manager"
  ON public.leave_types
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "block_delete_leave_types_hr_admin"
  ON public.leave_types
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "block_delete_leave_types_sys_admin"
  ON public.leave_types
  FOR DELETE TO authenticated
  USING (false);


-- =============================================================================
-- Step 4: Policies — profiles
-- =============================================================================
-- All roles: SELECT own profile row (required for self-service reads and for
--   the get_user_role() caller path before SECURITY DEFINER is invoked).
-- Manager: SELECT direct reports so the subquery in Step 6 leaves policies
--   resolves correctly under profiles RLS.
-- HR Admin: SELECT all non-deleted profiles.
-- Sys Admin: SELECT + INSERT + UPDATE all profiles (manages the directory).
-- TASK-012 handle_new_user() is SECURITY DEFINER — bypasses RLS; no INSERT
-- policy is needed for the trigger path.

CREATE POLICY "profiles_all_roles_select_own"
  ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    AND deleted_at IS NULL
  );

CREATE POLICY "manager_select_direct_reports"
  ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'manager'
    AND manager_id = auth.uid()
    AND deleted_at IS NULL
  );

CREATE POLICY "hr_admin_select_all_profiles"
  ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'hr_admin'
    AND deleted_at IS NULL
  );

CREATE POLICY "sys_admin_select_all_profiles"
  ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'sys_admin'
    AND deleted_at IS NULL
  );

CREATE POLICY "sys_admin_insert_profiles"
  ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'sys_admin');

CREATE POLICY "sys_admin_update_profiles"
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role() = 'sys_admin'
    AND deleted_at IS NULL
  )
  WITH CHECK (public.get_user_role() = 'sys_admin');

-- DELETE blocked — explicit per-role denial
CREATE POLICY "block_delete_profiles_employee"
  ON public.profiles
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "block_delete_profiles_manager"
  ON public.profiles
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "block_delete_profiles_hr_admin"
  ON public.profiles
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "block_delete_profiles_sys_admin"
  ON public.profiles
  FOR DELETE TO authenticated
  USING (false);


-- =============================================================================
-- Step 5: Policies — leave_balances
-- =============================================================================
-- No deleted_at column — no soft-delete filter on any policy here.
-- Manager: no access per TASK-011 CSV spec. If the approval flow requires
--   balance visibility, raise as a new task before TASK-016 integration tests
--   are written.
-- Sys Admin: no access (profiles only per task spec).

CREATE POLICY "employee_select_own_balances"
  ON public.leave_balances
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'employee'
    AND employee_id = auth.uid()
  );

CREATE POLICY "hr_admin_select_all_balances"
  ON public.leave_balances
  FOR SELECT TO authenticated
  USING (public.get_user_role() = 'hr_admin');

CREATE POLICY "hr_admin_update_all_balances"
  ON public.leave_balances
  FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'hr_admin')
  WITH CHECK (public.get_user_role() = 'hr_admin');

-- DELETE blocked — explicit per-role denial
CREATE POLICY "block_delete_leave_balances_employee"
  ON public.leave_balances
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "block_delete_leave_balances_manager"
  ON public.leave_balances
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "block_delete_leave_balances_hr_admin"
  ON public.leave_balances
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "block_delete_leave_balances_sys_admin"
  ON public.leave_balances
  FOR DELETE TO authenticated
  USING (false);


-- =============================================================================
-- Step 6: Policies — leaves
-- =============================================================================
-- Employee: SELECT + INSERT own rows only. Role check prevents a manager from
--   matching this policy for their own leave rows (strict per-role isolation).
-- Manager: SELECT + UPDATE direct reports only. The direct-reports subquery
--   runs under profiles RLS; the manager_select_direct_reports policy (Step 4)
--   makes those profile rows visible, so the subquery resolves correctly.
--   NULL manager_id safety: WHERE manager_id = auth.uid() evaluates to NULL
--   for rows where manager_id IS NULL — NULL ≠ TRUE, row is excluded. No
--   explicit NULL guard is needed; standard SQL NULL semantics apply.
-- HR Admin: SELECT + UPDATE all non-deleted leaves.
-- Sys Admin: no access (profiles only per task spec).

CREATE POLICY "employee_select_own_leaves"
  ON public.leaves
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'employee'
    AND employee_id = auth.uid()
    AND deleted_at IS NULL
  );

CREATE POLICY "employee_insert_own_leaves"
  ON public.leaves
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role() = 'employee'
    AND employee_id = auth.uid()
  );

CREATE POLICY "manager_select_direct_report_leaves"
  ON public.leaves
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'manager'
    AND employee_id IN (
      SELECT id FROM public.profiles
      WHERE manager_id = auth.uid()
        AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "manager_update_direct_report_leaves"
  ON public.leaves
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role() = 'manager'
    AND employee_id IN (
      SELECT id FROM public.profiles
      WHERE manager_id = auth.uid()
        AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (public.get_user_role() = 'manager');

CREATE POLICY "hr_admin_select_all_leaves"
  ON public.leaves
  FOR SELECT TO authenticated
  USING (
    public.get_user_role() = 'hr_admin'
    AND deleted_at IS NULL
  );

CREATE POLICY "hr_admin_update_all_leaves"
  ON public.leaves
  FOR UPDATE TO authenticated
  USING (
    public.get_user_role() = 'hr_admin'
    AND deleted_at IS NULL
  )
  WITH CHECK (public.get_user_role() = 'hr_admin');

-- DELETE blocked — explicit per-role denial
CREATE POLICY "block_delete_leaves_employee"
  ON public.leaves
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "block_delete_leaves_manager"
  ON public.leaves
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "block_delete_leaves_hr_admin"
  ON public.leaves
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "block_delete_leaves_sys_admin"
  ON public.leaves
  FOR DELETE TO authenticated
  USING (false);


-- =============================================================================
-- Step 7: Policies — audit_log
-- =============================================================================
-- Append-only table. No INSERT policy for any role — the TASK-013 audit
-- trigger function will be SECURITY DEFINER and bypass RLS for writes.
-- HR Admin: SELECT only. No UPDATE policy is deliberately created for any
--   role — the append-only guarantee is structural, not implicit.
-- UPDATE blocked: explicit per-role denial for all four roles, including
--   HR Admin (structural denial — cannot be granted by omission later).
-- DELETE blocked: explicit per-role denial.
-- Employee, Manager, Sys Admin: no SELECT access.

CREATE POLICY "hr_admin_select_audit_log"
  ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.get_user_role() = 'hr_admin');

-- UPDATE blocked — explicit per-role denial (including HR Admin)
CREATE POLICY "block_update_audit_log_employee"
  ON public.audit_log
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "block_update_audit_log_manager"
  ON public.audit_log
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "block_update_audit_log_hr_admin"
  ON public.audit_log
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "block_update_audit_log_sys_admin"
  ON public.audit_log
  FOR UPDATE TO authenticated
  USING (false);

-- DELETE blocked — explicit per-role denial
CREATE POLICY "block_delete_audit_log_employee"
  ON public.audit_log
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "block_delete_audit_log_manager"
  ON public.audit_log
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "block_delete_audit_log_hr_admin"
  ON public.audit_log
  FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "block_delete_audit_log_sys_admin"
  ON public.audit_log
  FOR DELETE TO authenticated
  USING (false);
