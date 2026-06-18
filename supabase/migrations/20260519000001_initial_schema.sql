-- =============================================================================
-- TASK-008: Initial database schema
-- Migration: 20260519000001_initial_schema.sql
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Step 1: Shared utility function — auto-maintain updated_at on any table
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- -----------------------------------------------------------------------------
-- Step 2: leave_types (no FK dependencies)
-- -----------------------------------------------------------------------------

CREATE TABLE public.leave_types (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        UNIQUE NOT NULL,
  default_days    NUMERIC     NOT NULL DEFAULT 0,
  allow_carryover BOOLEAN     NOT NULL DEFAULT false,
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  deleted_at      TIMESTAMPTZ
);


-- -----------------------------------------------------------------------------
-- Step 3: profiles (self-referential FK only; id supplied by auth trigger)
-- -----------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id          UUID        PRIMARY KEY,
  email       TEXT        UNIQUE NOT NULL,
  full_name   TEXT,
  role        TEXT        CHECK (role IN ('employee', 'manager', 'hr_admin', 'sys_admin')),
  manager_id  UUID        REFERENCES public.profiles(id),
  department  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);


-- -----------------------------------------------------------------------------
-- Step 4: leaves (depends on profiles + leave_types)
-- -----------------------------------------------------------------------------

CREATE TABLE public.leaves (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id        UUID        NOT NULL REFERENCES public.profiles(id),
  leave_type         TEXT        NOT NULL REFERENCES public.leave_types(name),
  start_date         DATE        NOT NULL,
  end_date           DATE        NOT NULL,
  reason             TEXT        NOT NULL,
  supporting_doc_url TEXT,
  status             TEXT        NOT NULL DEFAULT 'PENDING'
                                 CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  manager_note       TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);


-- -----------------------------------------------------------------------------
-- Step 5: leave_balances (depends on profiles + leave_types; no deleted_at)
-- -----------------------------------------------------------------------------

CREATE TABLE public.leave_balances (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID    NOT NULL REFERENCES public.profiles(id),
  leave_type  TEXT    NOT NULL REFERENCES public.leave_types(name),
  year        INT     NOT NULL,
  total_days  NUMERIC NOT NULL DEFAULT 0,
  used_days   NUMERIC NOT NULL DEFAULT 0,
  UNIQUE (employee_id, leave_type, year)
);


-- -----------------------------------------------------------------------------
-- Step 6: audit_log (depends on profiles; record_id has no FK by design —
--         referenced rows may be soft-deleted but audit entries must persist)
-- -----------------------------------------------------------------------------

CREATE TABLE public.audit_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT        NOT NULL,
  record_id  UUID        NOT NULL,
  action     TEXT        NOT NULL,
  actor_id   UUID        REFERENCES public.profiles(id),
  old_data   JSONB,
  new_data   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- -----------------------------------------------------------------------------
-- Step 7: updated_at triggers (profiles, leaves, leave_types only)
-- -----------------------------------------------------------------------------

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_leaves_updated_at
  BEFORE UPDATE ON public.leaves
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_leave_types_updated_at
  BEFORE UPDATE ON public.leave_types
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- -----------------------------------------------------------------------------
-- Step 8: Indexes
-- -----------------------------------------------------------------------------

-- profiles — manager subquery (critical for Manager RLS policy performance)
CREATE INDEX idx_profiles_manager_id    ON public.profiles(manager_id);
CREATE INDEX idx_profiles_email         ON public.profiles(email);

-- leaves
CREATE INDEX idx_leaves_employee_id     ON public.leaves(employee_id);
CREATE INDEX idx_leaves_status          ON public.leaves(status);
CREATE INDEX idx_leaves_employee_status ON public.leaves(employee_id, status);

-- leave_balances
CREATE INDEX idx_leave_balances_emp_year ON public.leave_balances(employee_id, year);

-- audit_log
CREATE INDEX idx_audit_log_created_at  ON public.audit_log(created_at);
CREATE INDEX idx_audit_log_actor_id    ON public.audit_log(actor_id);
CREATE INDEX idx_audit_log_action      ON public.audit_log(action);
