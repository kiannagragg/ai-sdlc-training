# Meridian LMS — Agent Instructions

## Project
Leave Management System for Meridian Corp (800 employees, 120 managers, 5 HR, 1 sys admin)

## Stack
- **Framework**: Next.js 16 (App Router, TypeScript strict)
- **Styling**: Tailwind CSS v4 (CSS-first config) + shadcn/ui primitives
- **Database**: Supabase PostgreSQL + PgBouncer (transaction-mode)
- **Auth**: Supabase Auth (magic link, @stratpoint.com domain allow-list)
- **Authz**: Supabase RLS (4 role-specific policies, no custom RBAC)
- **API**: Next.js Route Handlers (REST, co-located with frontend)
- **Email**: Resend (fire-and-forget async pattern)
- **Storage**: Supabase Storage (supporting documents, 5MB max)
- **Hosting**: Vercel (ap-southeast-1 function region)
- **Audit**: PostgreSQL triggers → append-only audit_log
- **CI/CD**: GitHub Actions (lint, typecheck, test, migrate)

## Backend Standards
- Every mutation Route Handler uses supabase-js service client for DB writes,
  browser client for reads
- SET app.current_user_id before every mutation for audit actor tracking
- Atomic transactions for balance deduction (BEGIN/COMMIT within handler)
- Notification dispatch is fire-and-forget (void call, never awaited before response)
- Error responses use AppError class → { error: { code, message, details },
  requestId } format
- Request ID format: LR-YYYY-NNNN (auto-increment per year)
- All handlers emit structured logging (request ID, action, duration, outcome)
- Only public.leaves and public.leave_balances have audit triggers
  (log_audit_event) — never write application-layer INSERTs to
  audit_log; the trigger handles it within the same transaction
- audit_log has no deleted_at column and is not soft-deleteable —
  never apply soft-delete patterns, add deleted_at, or attempt
  UPDATE or DELETE on audit_log rows

## Frontend Standards
- Server Components by default; Client Components only when interactivity needed
- Interactive pattern: Server Component fetches data → Client Component handles
  interactions → Server Action or Route Handler for mutations
- Forms use react-hook-form + shadcn/ui form components
- All interactive elements support 5 states: default, focused, valid-filled,
  invalid, disabled
- Character counters on all textareas (grey < threshold, red < min, green ≥ min)
- Modals close on backdrop click and Escape key

## Security Rules
- Supabase service role key NEVER in client bundle (no NEXT_PUBLIC prefix)
- Authorization uses three non-optional layers: (1) middleware for
  role-based route access, (2) Supabase RLS for row-level data
  isolation, (3) server-side query scoping for manager direct-report
  enforcement — omitting any layer is a security defect
- Audit log is append-only: RLS blocks UPDATE/DELETE for all roles including
  service_role
- Soft-delete only: all business tables have deleted_at; RLS blocks DELETE
- File uploads: PDF or image only, max 5MB, validated at client + server + storage
- No role can view another role's restricted routes (middleware enforces per-role
  route access)

## Git Conventions
- Branch: sprint-{n}/{epic-shortname}/{task-id}-kebab-description
  Example: sprint-1/auth/login-page-TASK-015
- Commits: {task-id}: {action} {summary}
  Example: TASK-015: implement login page with magic link flow
- PR title: Sprint {n} — {task-id}: {description}
- Squash merge to main

## Quality Gates (pre-merge)
1. npm run lint — zero errors
2. npm run type-check — zero errors
3. npm run test — all passing
4. supabase db push — migrations apply cleanly (CI)
5. Preview deployment returns HTTP 200 (Vercel)
6. PR approved by at least one reviewer
