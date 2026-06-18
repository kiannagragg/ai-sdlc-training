# Implementation & Test Workflow

## Implementation Sequence

```
Read Spec → Create Migration → Create Types → Create Route Handler → Create Component → Create Tests → Verify RLS
```

### Step-by-step

| Step | Description | Artifact |
|---|---|---|
| **1. Read Spec** | Understand requirements, data model, auth rules | PRD / ticket |
| **2. Create Migration** | Write SQL migration (see `prompts/dev/new-migration.md`) | `supabase/migrations/YYYYMMDDHHMMSS_description.sql` |
| **3. Create Types** | Zod schemas + TypeScript types | `types/*.ts`, `lib/schemas/*.ts` |
| **4. Create Route Handler** | API endpoint with auth, validation, error handling | `app/api/*/route.ts` |
| **5. Create Component** | Server component + client sub-components | `components/**/*.tsx` |
| **6. Create Tests** | Unit + integration tests | `__tests__/**/*.test.ts` |
| **7. Verify RLS** | Run RLS policy tests as different roles | `__tests__/integration/rls/*.test.ts` |

## Per-file Checklist

### Migration (`*.sql`)
- [ ] Table columns match spec
- [ ] All constraints present (CHECK, FK, NOT NULL)
- [ ] Soft-delete column included
- [ ] Indexes for query patterns
- [ ] RLS policies for every operation
- [ ] Audit trigger if mutable
- [ ] Idempotent seed data
- [ ] Down migration for rollback

### Types (`*.ts`)
- [ ] Zod schema validates all fields
- [ ] TypeScript type exported from Zod inference
- [ ] Proper error messages for each field
- [ ] Enums match DB CHECK constraints

### Route Handler (`route.ts`)
- [ ] Auth check at top
- [ ] `set_actor` for audit
- [ ] Zod re-validation
- [ ] Atomic mutations (transaction / RPC)
- [ ] Fire-and-forget notification
- [ ] `requestId` in response
- [ ] Structured logging on error
- [ ] `handleApiError` wraps all exceptions

### Component (`*.tsx`)
- [ ] Server component by default
- [ ] `'use client'` only when necessary
- [ ] 5-state form validation
- [ ] Responsive layout (`p-4 lg:p-6`)
- [ ] Loading skeleton (`loading.tsx`)
- [ ] Error boundary (`error.tsx`)
- [ ] Metadata set

### Tests (`*.test.ts`)
- [ ] Unit test coverage ≥ 80%
- [ ] Integration test for happy path + error paths
- [ ] RLS test as each role (anon, user, admin)
- [ ] Side-effect isolation (no shared DB state)
- [ ] Cleanup after each test

## Test Coverage Thresholds

| Layer | Minimum Coverage |
|---|---|
| Zod schemas | 100% |
| Route handlers (unit) | 90% |
| Route handlers (integration) | 80% |
| Components (unit) | 80% |
| RLS policies | 100% of policy branches |
| Database constraints | 100% |

## Branch Naming

```
sprint-{n}/{epic-shortname}/{task-id}-kebab-description
```

Examples:
```
sprint-3/leave-requests/MER-42-create-leave-request-form
sprint-3/leave-requests/MER-45-add-leave-balance-api
sprint-4/approval-workflow/MER-67-admin-approval-page
```

## Commit Format

```
{task-id}: {action} {summary}
```

| Action | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `migration` | Database migration |
| `types` | Type definitions |
| `refactor` | Code restructure |
| `test` | Tests only |
| `docs` | Documentation |
| `chore` | Tooling, config, deps |

Examples:
```
MER-42: feat add leave request form with validation
MER-43: migration create leave_requests table
MER-45: fix balance not updating after approval
MER-67: test add RLS policy tests for admin role
```

## PR Checklist

- [ ] All checklist items complete for each changed file
- [ ] Migration has down migration
- [ ] No `console.log` committed
- [ ] No service role key exposed to client
- [ ] All existing tests pass
- [ ] New tests meet coverage thresholds
- [ ] Manual test: happy path on local Supabase
- [ ] Manual test: error path (invalid data, unauthorized)
- [ ] Branch rebased on latest main
- [ ] PR description includes "Closes MER-XX"
