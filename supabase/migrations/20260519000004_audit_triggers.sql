-- =============================================================================
-- TASK-013: Audit trigger engine on leaves and leave_balances
-- Migration: 20260519000004_audit_triggers.sql
-- =============================================================================
--
-- Creates a SECURITY DEFINER trigger function log_audit_event() and two
-- AFTER triggers on leaves and leave_balances that automatically capture
-- every state change in audit_log with actor identity, UTC timestamp, and
-- before/after JSONB snapshots.
--
-- SECURITY DEFINER: Satisfies the audit_log INSERT block declared in
-- 20260519000002_rls_policies.sql (lines 350-351). The trigger function
-- bypasses RLS on audit_log — no INSERT policy is required for any role.
-- All INSERT, UPDATE, and DELETE operations on audit_log via the
-- authenticated role are blocked by the RLS policies in 000002.
--
-- Required apply order: 000001 → 000002 → 000003 → 000004
--
-- RISK ACCEPTANCE: service_role BYPASSRLS (same gap as 000002, lines 19-21).
-- This is accepted because SECURITY DEFINER must BYPASSRLS to write via the
-- trigger, and service_role cannot be selectively excluded without breaking
-- the trigger. Mitigation: service role key is server-side only per AGENTS.md.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Step 1: SECURITY DEFINER trigger function — log every state change
-- -----------------------------------------------------------------------------
-- Reads actor_id from app.current_user_id custom GUC set by Route Handlers
-- before mutations (AGENTS.md: "SET app.current_user_id before every mutation
-- for audit actor tracking"). Returns NULL gracefully if unset.
--
-- Action derivation (leaves):
--   INSERT                                    → SUBMITTED
--   UPDATE, NEW.status = APPROVED             → APPROVED
--   UPDATE, NEW.status = REJECTED             → REJECTED
--   UPDATE, NEW.status = CANCELLED            → CANCELLED
--   UPDATE, NEW.status = PENDING              → SUBMITTED (resubmission after
--                                                cancellation; audited as
--                                                same action as first submit)
--   UPDATE, NEW.status = OLD.status           → OVERRIDDEN (HR Admin changed
--                                                non-status fields)
--
-- Action derivation (leave_balances):
--   UPDATE (always)                           → ENTITLEMENT_CHANGED
--
-- old_data = row_to_json(OLD)::jsonb (NULL for INSERT)
-- new_data = row_to_json(NEW)::jsonb for all events

CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_action   TEXT;
BEGIN
  -- Safe cast: NULLIF handles both NULL (GUC unset) and '' (empty string)
  v_actor_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;

  IF TG_TABLE_NAME = 'leaves' THEN
    IF TG_OP = 'INSERT' THEN
      v_action := 'SUBMITTED';
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        -- PENDING on UPDATE = resubmission after cancellation; audited as 'SUBMITTED'
        v_action := CASE NEW.status
          WHEN 'APPROVED'  THEN 'APPROVED'
          WHEN 'REJECTED'  THEN 'REJECTED'
          WHEN 'CANCELLED' THEN 'CANCELLED'
          WHEN 'PENDING'   THEN 'SUBMITTED'
        END;
      ELSE
        v_action := 'OVERRIDDEN';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'leave_balances' THEN
    IF TG_OP = 'UPDATE' THEN
      v_action := 'ENTITLEMENT_CHANGED';
    END IF;
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, actor_id, old_data, new_data, created_at)
  VALUES (TG_TABLE_NAME, NEW.id, v_action, v_actor_id,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD)::jsonb END,
    row_to_json(NEW)::jsonb,
    NOW()
  );

  RETURN NULL;
END;
$$;


-- -----------------------------------------------------------------------------
-- Step 2: AFTER triggers — leaves (INSERT + UPDATE), leave_balances (UPDATE)
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS log_leaves_audit ON public.leaves;

CREATE TRIGGER log_leaves_audit
  AFTER INSERT OR UPDATE ON public.leaves
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS log_leave_balances_audit ON public.leave_balances;

CREATE TRIGGER log_leave_balances_audit
  AFTER UPDATE ON public.leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit_event();
