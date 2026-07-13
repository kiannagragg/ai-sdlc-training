-- =============================================================================
-- TASK-019: Create leave_documents storage bucket and RLS policies
-- Migration: 20260519000005_leave_documents_storage.sql
-- =============================================================================
--
-- HARD PREREQUISITE: This migration uses get_user_role(), defined in
-- 20260519000002_rls_policies.sql. The handle_new_user() trigger from
-- 20260519000003_profiles_trigger.sql must also be applied so that
-- get_user_role() returns the correct role for each authenticated user.
--
-- Required apply order: 000001 → 000002 → 000003 → 000005
--
-- Bucket path convention: {employee_id}/{leave_id}/{original_filename}
--   Segment [1] = employee_id (UUID) — used by RLS for folder-scoped access
--   Segment [2] = leave_id   (UUID) — groups documents under a leave request
--   Segment [3] = original filename
--
-- No client-side write policies are created. Uploads are exclusively
-- server-mediated via the service-role client (BYPASSRLS). This is a
-- security requirement: the client never uploads directly.
--
-- Sys Admin is deliberately excluded from read access. Per the project
-- security model (AGENTS.md, Epic 0/1), Sys Admin is an infrastructure
-- role with access scoped to the profiles table only. The default-deny
-- nature of RLS blocks access; an explicit deny policy is also created
-- for visibility and consistency with the defensive convention in
-- 000002_rls_policies.sql.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Step 1: Create the leave_documents bucket (idempotent)
-- -----------------------------------------------------------------------------

SELECT storage.create_bucket(
  'leave_documents',                                  -- bucket id
  'leave_documents',                                  -- bucket name
  false,                                              -- not public
  5242880,                                            -- 5 MB file_size_limit
  null,                                               -- no default locale
  ARRAY['application/pdf', 'image/jpeg', 'image/png'] -- allowed MIME types
)
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'leave_documents'
);


-- -----------------------------------------------------------------------------
-- Step 2: Storage RLS policies — SELECT only (no INSERT/UPDATE/DELETE)
-- -----------------------------------------------------------------------------
-- Policy naming follows the convention in 000002_rls_policies.sql:
--   {role}_{action}_{resource}
--
-- Storage policies apply to storage.objects. The bucket_id filter ensures
-- these policies only affect the leave_documents bucket.

-- Employee: read own folder only
-- (storage.foldername(name))[1] extracts the first path segment (employee_id).
-- Compares as text to match UUID-to-text cast of auth.uid().
CREATE POLICY "employee_select_leave_documents"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'leave_documents'
    AND public.get_user_role() = 'employee'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Manager: read direct reports' folders
-- Subquery against profiles.manager_id (indexed by idx_profiles_manager_id).
-- Reuses the same direct-reports pattern from 000002 (leaves policy, lines 286-290).
-- Not exercised until Epic 3 but created now to avoid a second migration.
CREATE POLICY "manager_select_leave_documents"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'leave_documents'
    AND public.get_user_role() = 'manager'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.profiles
      WHERE manager_id = auth.uid()
        AND deleted_at IS NULL
    )
  );

-- HR Admin: full read access to all leave documents
CREATE POLICY "hr_admin_select_leave_documents"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'leave_documents'
    AND public.get_user_role() = 'hr_admin'
  );

-- Sys Admin: explicit deny — no read access to leave documents.
-- Default-deny RLS already blocks this; explicit policy for visibility
-- and consistency with the defensive convention in 000002_rls_policies.sql.
CREATE POLICY "block_select_leave_documents_sys_admin"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'leave_documents' AND false);
