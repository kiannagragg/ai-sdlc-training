---
name: test-coverage-check
description: Checks whether a single acceptance criterion is covered across happy-path, denial/boundary, and error/failure dimensions in a Meridian LMS test file, with LMS-specific RLS deviation handling.
tools: [Read, Grep]
---

## What this skill provides

The three-dimension AC coverage checklist methodology used in the Meridian LMS project. Narrower than the unit-test-reviewer agent — provides the framework for a single AC at a time, not a full review session.

## Inputs

1. **Acceptance criterion** — the AC as a plain-text statement (e.g. "Employee can INSERT own leave")
2. **Test reference** — file path to the test file, or a specific test block / line range within it

## What to do

**Step 0 — Read the test file** or navigate to the specified test block before checking any dimension.

For the given AC, check three dimensions in order:

| Step | Dimension | What to verify |
|------|-----------|----------------|
| 1 | **Happy path** | Does a test exist proving the allowed operation works and returns the expected result? |
| 2 | **Denial / boundary** | Does a test exist proving the blocked operation returns empty or zero results? |
| 3 | **Error / failure** | Does a test exist proving the blocked operation raises the documented error? |

Apply known deviations **before** flagging Step 3:

| Deviation | Handling |
|-----------|----------|
| DELETE with `USING(false)` returns 0 rows, not an RLS error | Do NOT flag — assert `count === 0` / `data === []`, not an exception |
| `audit_log` INSERT is a hard RLS error | DO flag if the assertion is missing — this one is required |
| Domain restriction (`@stratpoint.com`) auth tests | Deferred per TASK-015 — do NOT flag |

**Single-outcome ACs** (e.g. "Migration applies cleanly"): check Step 1 only. Mark Steps 2 and 3 as **N/A**.

## Output format

A three-row inline table followed by a one-line verdict.

| Dimension | Status | Evidence or Gap |
| Happy path | PASS | Test exists at line 42, asserts INSERT succeeds |
| Denial-boundary | MISSING | No test verifies SELECT returns empty for another's leaves |
| Error-failure | N/A | Single-outcome AC — error dimension does not apply |

**Status values:** `PASS` / `MISSING` / `N/A`

**Verdict** (one line, always included):

- `COVERED` — all applicable dimensions are PASS (or N/A)
- `GAPS FOUND` — list the dimensions that are MISSING

## Constraints

- Does not review the full AC list — one AC at a time only
- Does not suggest implementation fixes
- Does not run or execute tests
- Does not replace the unit-test-reviewer agent for full reviews
- Does not evaluate code style or test quality beyond coverage
- `PARTIAL` severity is intentionally excluded — for a single dimension, a test either exists (PASS) or does not (MISSING). Use the unit-test-reviewer agent for PARTIAL detection across the full AC list.
