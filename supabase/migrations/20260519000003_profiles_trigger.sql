-- =============================================================================
-- TASK-012: Profiles auto-creation trigger on first login
-- Migration: 20260519000003_profiles_trigger.sql
-- =============================================================================
--
-- Creates a trigger on auth.users that automatically inserts a corresponding
-- row into public.profiles with role = 'employee' whenever a new Supabase Auth
-- user is created.
--
-- PREREQUISITE SATISFACTION: This migration fulfills the dependency declared
-- in 20260519000002_rls_policies.sql (lines 6-14). The handle_new_user()
-- trigger populates profiles.role, which get_user_role() reads. With both
-- migrations applied, every authenticated user's role resolves correctly in
-- all RLS policy USING / WITH CHECK expressions.
--
-- Required apply order: 000001 → 000002 → 000003
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Step 1: SECURITY DEFINER trigger function — auto-create profiles row
-- -----------------------------------------------------------------------------
-- Runs as function owner (postgres/superuser), bypassing RLS on profiles.
-- No INSERT policy is needed for the trigger path — see the comment in
-- 20260519000002_rls_policies.sql line 128.
-- Insert uses ON CONFLICT (id) DO NOTHING for idempotency so that re-running
-- this migration or a duplicate auth user creation does not raise an error.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, manager_id, department, created_at, updated_at)
  VALUES (NEW.id, NEW.email, '', 'employee', NULL, NULL, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NULL;
END;
$$;


-- -----------------------------------------------------------------------------
-- Step 2: Trigger on auth.users — fires after every new auth user creation
-- -----------------------------------------------------------------------------
-- AFTER INSERT (not BEFORE): guarantees the auth.users row has been committed
-- before we attempt the profiles INSERT, avoiding orphan profiles rows if
-- the auth INSERT fails.
-- Idempotent: DROP IF EXISTS followed by CREATE ensures clean re-apply.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
