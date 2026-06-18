# New Migration Template

## File Naming

```
YYYYMMDDHHMMSS_description.sql
```

Example: `20260505143000_create_leave_requests.sql`

## Migration Template

```sql
-- Migration: YYYYMMDDHHMMSS_description
-- Description: <brief description of what this migration does>
-- Author: <name>

-- ============================================================
-- 1. Create table
-- ============================================================
CREATE TABLE leave_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type    TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'emergency', 'unpaid', 'paternity', 'maternity')),
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL CHECK (end_date >= start_date),
  status        TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ DEFAULT NULL,
  created_by    UUID REFERENCES profiles(id),
  updated_by    UUID REFERENCES profiles(id),
  deleted_by    UUID REFERENCES profiles(id)
);

-- ============================================================
-- 2. Soft-delete column (always included)
-- ============================================================
-- deleted_at column included in CREATE TABLE above

-- ============================================================
-- 3. Indexes for query patterns
-- ============================================================
CREATE INDEX idx_leave_requests_user_id ON leave_requests (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_leave_requests_status ON leave_requests (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leave_requests_date_range ON leave_requests (start_date, end_date) WHERE deleted_at IS NULL;

-- ============================================================
-- 4. Audit trigger (if mutable business data)
-- ============================================================
CREATE TRIGGER audit_leave_requests
  AFTER INSERT OR UPDATE OR DELETE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Or row-level tracking:
CREATE TRIGGER set_timestamps
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. Enable Row Level Security
-- ============================================================
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS Policies
-- ============================================================

-- Users can view their own active requests
CREATE POLICY "view_own_requests" ON leave_requests
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Users can insert their own requests
CREATE POLICY "insert_own_requests" ON leave_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending requests
CREATE POLICY "update_own_pending_requests" ON leave_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'PENDING' AND deleted_at IS NULL);

-- Block DELETE (soft-delete only via UPDATE)
CREATE POLICY "block_delete" ON leave_requests
  FOR DELETE USING (false);

-- Admins can view all active requests
CREATE POLICY "admin_view_all" ON leave_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    AND deleted_at IS NULL
  );

-- Admins can update any request (approve/reject)
CREATE POLICY "admin_update_all" ON leave_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    AND deleted_at IS NULL
  );

-- ============================================================
-- 7. Idempotent seed data (if needed)
-- ============================================================
-- INSERT INTO leave_types (code, label, days_per_year)
-- VALUES
--   ('annual', 'Annual Leave', 20),
--   ('sick', 'Sick Leave', 10)
-- ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 8. Down migration (optional, for rollback)
-- ============================================================
-- DROP TRIGGER IF EXISTS audit_leave_requests ON leave_requests;
-- DROP TABLE IF EXISTS leave_requests;
```

## Migration Checklist

- [ ] File named `YYYYMMDDHHMMSS_description.sql`
- [ ] `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` on every table
- [ ] `created_at` + `updated_at` timestamps
- [ ] `deleted_at` column on mutable business tables
- [ ] `CHECK` constraints for enum-like columns (not separate enum types)
- [ ] `NOT NULL` + `FOREIGN KEY` constraints
- [ ] Indexes for all query patterns (WHERE, JOIN, ORDER BY)
- [ ] RLS enabled with policies for each operation
- [ ] DELETE policy returns false (force soft-delete)
- [ ] Audit trigger if table contains mutable business data
- [ ] `ON CONFLICT DO NOTHING` for seed data (idempotent)
- [ ] Down migration commented at bottom
