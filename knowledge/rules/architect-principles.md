# Architecture Principles

## Three-Layer Defense

Every data mutation passes through three independent validation layers:

```
Client Validation → Server Validation → DB Constraints
     (Zod)            (Zod + RLS)      (RLS + CHECK + FK)
```

| Layer | Responsibility | Technology |
|---|---|---|
| **1. Client** | UX feedback, early error capture | Zod schema in form, disabled submit until valid |
| **2. Server** | Business rules, authorization, sanitization | Zod re-validation, Supabase RLS policies |
| **3. Database** | Data integrity, referential integrity | `CHECK` constraints, `NOT NULL`, `UNIQUE`, `FOREIGN KEY`, RLS |

**Never trust the client.** The server layer always re-validates. The DB is the final gate.

## Fire-and-Forget Notifications

Notification dispatch must never block the response:

```typescript
// ✅ Correct
const response = await createLeaveRequest(data);
notifyUser(response.userId, response.id); // intentionally NOT awaited

// ❌ Wrong
await notifyUser(response.userId, response.id); // blocks response
```

Use `void` keyword or `.catch()` to signal intent:

```typescript
void notifyUser(userId, requestId);
```

## Atomic Balance Deduction

All balance-affecting operations use database transactions:

```typescript
// Route handler pattern
const { data, error } = await supabase.rpc('deduct_leave_balance', {
  p_user_id: userId,
  p_days: days,
});

// RPC internally:
// BEGIN;
//   SELECT INTO balance FROM leave_balances WHERE user_id = p_user_id FOR UPDATE;
//   UPDATE leave_balances SET remaining = remaining - p_days WHERE user_id = p_user_id;
//   INSERT INTO leave_requests (...) VALUES (...);
// COMMIT;
```

- Always use `SELECT ... FOR UPDATE` on balance rows
- Reject if balance would go negative (`CHECK (remaining >= 0)`)
- Rollback entire transaction on any failure

## SET LOCAL Actor Tracking

Before every mutation, set the current actor for audit triggers:

```typescript
await supabase.rpc('set_actor', { actor_id: user.id });
// or directly:
await supabase.from('leave_requests').insert({
  ...data,
  created_by: user.id,
});
```

The `set_actor` RPC sets `app.current_user_id` via `SET LOCAL` so audit triggers
can record `created_by`, `updated_by`, and `deleted_by` automatically.

## Soft-Delete Everywhere

All mutable business tables have a `deleted_at` column:

```sql
ALTER TABLE leave_requests ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX idx_leave_requests_active ON leave_requests (id) WHERE deleted_at IS NULL;
```

- **DELETE** is blocked by RLS for all roles (trigger returns error)
- Client queries automatically append `WHERE deleted_at IS NULL`
- Admin restore via `UPDATE ... SET deleted_at = NULL`
- Data is never physically removed (except GDPR erasure requests)

## RLS as Single Authz Source

Frontend role checks are UX convenience, not security:

```sql
-- RLS policy — the REAL security boundary
CREATE POLICY "users_can_only_see_own_requests" ON leave_requests
  FOR SELECT USING (auth.uid() = user_id);
```

- Role-based UI elements (`if (role === 'admin')`) hide/show buttons but
  never prevent access
- All API routes re-verify authorization via RLS
- Service role used only for server-to-server operations (never exposed)

## Audit Log Append-Only

The `audit_log` table is immutable:

| Operation | Allowed? |
|---|---|
| `INSERT` | ✅ Yes |
| `SELECT` | ✅ Yes |
| `UPDATE` | ❌ No — RLS denies |
| `DELETE` | ❌ No — RLS denies (all roles including `service_role`) |

```sql
CREATE POLICY "audit_log_append_only" ON audit_log
  FOR UPDATE USING (false);
CREATE POLICY "audit_log_no_delete" ON audit_log
  FOR DELETE USING (false);
```

## Service Role Key Never in Client Bundle

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the only key exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` lives only in `.env.local` and server-only code
- Server route handlers import `@/lib/supabase/service` which uses the service key
- Client components import `@/lib/supabase/client` which uses the anon key
- Middleware imports `@/lib/supabase/middleware` middleware-only client
