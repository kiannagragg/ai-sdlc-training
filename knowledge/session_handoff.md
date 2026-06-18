# Session Handoff — Sprint 1 / Epic 1

**Date:** 2026-06-17
**Last completed task:** TASK-011
**Next task to begin immediately:** TASK-012 — `20260519000003_profiles_trigger.sql`

---

## TASK-011 Status: COMPLETE

**Deliverable:** `app-repo/supabase/migrations/20260519000002_rls_policies.sql`

**Summary:** 44 RLS policies across 5 tables + `public.get_user_role()` SECURITY DEFINER helper.
Applied cleanly via `psql` against a throwaway `postgres:15-alpine` container. Verified against
`pg_policies` and `pg_proc` system catalogs.

### Acceptance Criteria Results

| # | Criterion | Result |
|---|---|---|
| 1 | RLS enabled on profiles, leaves, leave_balances, leave_types, audit_log | PASS — `rowsecurity = t` confirmed on all 5 via `pg_tables` |
| 2 | Employee SELECT + INSERT own leaves; cannot read another's | PASS — `employee_select_own_leaves` USING `employee_id = auth.uid()`, `employee_insert_own_leaves` WITH CHECK same |
| 3 | Manager SELECT + UPDATE direct reports' leaves; blocked from non-reports | PASS — `manager_select_direct_report_leaves` / `manager_update_direct_report_leaves` both use `employee_id IN (SELECT id FROM profiles WHERE manager_id = auth.uid())` |
| 4 | HR Admin SELECT + UPDATE leaves, leave_balances, leave_types | PASS — 6 policies covering all three tables |
| 4a | HR Admin SELECT + UPDATE audit_log | **DEVIATION** — UPDATE intentionally omitted; see flag below |
| 5 | Sys Admin profiles only; SELECT on leaves returns empty set | PASS — no leaves/leave_balances/leave_types/audit_log policies for sys_admin role |
| 6 | DELETE blocked all tables all roles | PASS (authenticated users) — 20 `USING(false)` policies; see flag below |
| 7 | INSERT on audit_log blocked for all roles (RLS error) | PASS — no INSERT policy on audit_log; PostgreSQL raises hard error on INSERT with no permissive policy |
| 8 | Migration applies cleanly via supabase db push | **SUBSTITUTED** — applied via `psql` + `ON_ERROR_STOP=1` against `postgres:15-alpine`; zero errors; accepted as equivalent with same caveat as TASK-008/009 |
| 9 | profiles(manager_id) index verified present | PASS (documented) — index confirmed in `000001_initial_schema.sql` line 128; no runtime assertion in migration |

### Architectural Decisions Locked In

- **`public.get_user_role()` SECURITY DEFINER:** Reads `profiles.role` for `auth.uid()` while
  bypassing RLS on `profiles`. Required to prevent recursive RLS evaluation when profiles
  policies check the caller's role. Is `STABLE` and uses `SET search_path = public`. Every
  non-trivial USING / WITH CHECK expression calls this function.

- **Role checks in every non-trivial policy:** Each policy includes `get_user_role() = '<role>'`
  in its USING/WITH CHECK so that policies for different roles cannot overlap. A manager cannot
  match the employee SELECT policy for their own leaves — strict per-role isolation.

- **Manager direct-reports subquery runs under profiles RLS:** `employee_id IN (SELECT id FROM
  profiles WHERE manager_id = auth.uid() AND deleted_at IS NULL)` is safe because the
  `manager_select_direct_reports` policy on `profiles` makes exactly those rows visible to the
  manager. No SECURITY DEFINER wrapper needed for the subquery itself.

- **NULL `manager_id` is safe by SQL semantics:** `WHERE manager_id = auth.uid()` evaluates to
  NULL (not TRUE) for any row where `manager_id IS NULL` — those employees never appear in any
  manager's result set. No explicit NULL guard needed.

- **`audit_log` has no INSERT policy (structural, not just absent):** With RLS enabled and zero
  permissive INSERT policies, all application-layer inserts raise a hard PostgreSQL error.
  TASK-013's `log_audit_event()` trigger function must be `SECURITY DEFINER` to bypass this and
  write audit entries. This is the intended design — do not add an INSERT policy for any role.

- **All DELETE blocks are PERMISSIVE `USING(false)`, not RESTRICTIVE:** Four per-role policies
  per table, all with `USING(false)`, OR'd together = false. Named per role (e.g.,
  `block_delete_leaves_employee`) to make intent explicit in `pg_policies` output.

### Flags and Accepted Deviations

- **FLAG (deviation — action required):** CSV AC-4 says "HR Admin can SELECT and UPDATE all …
  audit_log." The migration gives HR Admin SELECT only on `audit_log`; `block_update_audit_log_hr_admin`
  explicitly denies UPDATE. This was an approved override: append-only guarantee must be
  structural. **Action: update TASK-011 acceptance criterion in the CSV before TASK-016
  integration tests are written** — the test for HR Admin on audit_log must assert UPDATE fails,
  not succeeds.

- **FLAG (test wording):** CSV AC-6 says "DELETE returns RLS error." PostgreSQL RLS USING(false)
  silently returns 0 rows — it does NOT raise an error for DELETE (only INSERT triggers a hard
  error). **Action: TASK-016 DELETE tests must assert `count === 0` or `data === []`, not an
  exception.**

- **FLAG (known gap):** service_role has `BYPASSRLS` in Supabase and cannot be blocked by RLS
  policies. CSV description says "including service role." Blocking requires revoking `BYPASSRLS`
  — not feasible without breaking trigger functions and server-side Route Handlers. **Risk
  accepted.** service_role is restricted to server-side code only per AGENTS.md.

- **Hard prerequisite documented in migration header:** `get_user_role()` returns NULL for all
  users until TASK-012's `handle_new_user()` trigger populates `profiles.role`. Applying
  `000002` without subsequently applying `000003` locks out every authenticated user.

### Verification environment stubs (not in migration — Supabase provides these in real deployment)

- `CREATE SCHEMA auth` + `CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid … AS $$ SELECT NULL::uuid $$`
- `CREATE ROLE authenticated NOLOGIN`

---

## Dependency Chain State

```
TASK-008 (schema)            ✅ COMPLETE — 20260519000001_initial_schema.sql
TASK-009 (seed data)         ✅ COMPLETE — supabase/seed.sql
TASK-010 (Epic 1 epic row)   ✅ unblocked (no deliverable — tracking only)
TASK-011 (RLS policies)      ✅ COMPLETE — 20260519000002_rls_policies.sql
TASK-012 (profiles trigger)  ← NEXT — unblocked; blocked by nothing
TASK-013 (audit triggers)    blocked on TASK-012
TASK-014 (middleware)        blocked on TASK-011 ✅ + TASK-012
TASK-015 (login page)        blocked on TASK-012 + TASK-014
TASK-016 (integration tests) blocked on TASK-013 + TASK-015
```

---

## Next Session: Begin TASK-012

**Deliverable:** `app-repo/supabase/migrations/20260519000003_profiles_trigger.sql`

**Load these files first, in this order:**

1. `docs/dev-tasks/epic-1-auth-access-control-tasks.csv` — read TASK-012 row for exact acceptance
   criteria (source of truth; do not rely on this handoff's summary)
2. `app-repo/supabase/migrations/20260519000001_initial_schema.sql` — confirm `profiles` column
   names, especially that `profiles.id` has no DEFAULT and `role` defaults to nothing
   (the trigger must supply all required values explicitly)
3. `app-repo/supabase/migrations/20260519000002_rls_policies.sql` — confirm the trigger function
   must be `SECURITY DEFINER` (profiles INSERT policy only allows `sys_admin`; the trigger must
   bypass RLS to insert on behalf of a brand-new user who has no role yet)

**Key constraints TASK-012 must satisfy:**
- Function: `public.handle_new_user()` fires `AFTER INSERT ON auth.users FOR EACH ROW`
- Inserts: `id = NEW.id`, `email = NEW.email`, `role = 'employee'`, `manager_id = NULL`,
  `department = NULL`, timestamps explicit
- Must be `SECURITY DEFINER` — the new user has no profiles row yet, so `get_user_role()`
  returns NULL, and the `sys_admin_insert_profiles` RLS policy would reject the insert
- Must use `INSERT … ON CONFLICT (id) DO NOTHING` for idempotency
- Requires `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users …`
- Verify in emulator: creating a test `auth.users` row produces a `profiles` row

---

## TASK-009 Status: COMPLETE

*(See prior session handoff content below — unchanged.)*

**Deliverable:** `/supabase/seed.sql`

A prior version of this file existed in the repo but did **not** match TASK-009's actual
acceptance criteria (source: `docs/dev-tasks/epic-0-project-setup-tasks.csv`, repo root —
note this is outside `app-repo/`, not under `app-repo/docs/`). It was rewritten from scratch.

**Fixed UUIDs used (stable across `supabase db reset` runs):**

| Role | Email | UUID |
|---|---|---|
| manager | manager@stratpoint.com | `11111111-1111-1111-1111-111111111111` |
| employee | employee1@stratpoint.com | `22222222-2222-2222-2222-222222222222` |
| employee | employee2@stratpoint.com | `33333333-3333-3333-3333-333333333333` |
| hr_admin | hr@stratpoint.com | `44444444-4444-4444-4444-444444444444` |
| sys_admin | sysadmin@stratpoint.com | `55555555-5555-5555-5555-555555555555` |

Both employees report to the manager UUID above (`manager_id = 11111111…`). Leave balances
seeded for both employees across all 4 leave types for `EXTRACT(YEAR FROM CURRENT_DATE)`.

**Verification caveat:** `npx supabase start` cannot complete on this machine — CLI binary's own
loopback connection is silently blocked by local endpoint security/firewall. Do not re-attempt
without confirming binary is allow-listed. Verification uses `psql` against a throwaway
`postgres:15-alpine` container as accepted substitute.

---

## TASK-008 Status: COMPLETE

**Deliverable:** `/supabase/migrations/20260519000001_initial_schema.sql`

All 10 acceptance criteria passed. Architectural guardrails locked in during this task
(explicit `leave_type TEXT REFERENCES leave_types(name)` FK, no DEFAULT on `profiles.id`,
no FK on `audit_log.record_id`, nullable `old_data`, no `deleted_at` on `leave_balances`,
custom `handle_updated_at()` instead of `moddatetime` extension) are documented in the
prior session handoff and remain in force. Do not re-litigate.
