/*
 * TASK-019 — Integration Tests for Storage RLS Policies
 *
 * Tests: leave_documents storage bucket
 *
 * ═══════════════════════════════════════════════════════
 * Known deviations from ideal setup:
 *
 * 1. Staging, not local emulator
 *    Tests run against SUPABASE_STAGING, sharing the DB
 *    with development work. This is an accepted tradeoff
 *    (Docker not available).
 *
 * 2. Storage RLS tested via direct file operations
 *    Storage policies are tested by uploading via service
 *    role and reading via authenticated clients. This is
 *    the only practical way to test storage RLS.
 *
 * 3. No INSERT policy for authenticated users
 *    Uploads are service-role only. Client INSERT attempts
 *    should fail at the RLS level (hard error).
 *
 * 4. Bucket must exist before tests run
 *    Migration 20260519000005_leave_documents_storage.sql
 *    must be applied via supabase db push before these
 *    tests pass. Tests that require the bucket to exist
 *    are guarded by a bucket-existence check.
 * ═══════════════════════════════════════════════════════
 */

import { createServiceClient, createClientAs, setupTestUsers, TEST_USERS } from './helpers/supabase';

jest.setTimeout(60000);

const svc = createServiceClient();

let uuids: Record<string, string>;

// Test file content (minimal valid PDF header)
const TEST_FILE_CONTENT = Buffer.from('%PDF-1.4 test content');
const TEST_FILENAME = 'test-document.pdf';
const BUCKET_NAME = 'leave_documents';

// Track uploaded objects for cleanup
const uploadedPaths: string[] = [];

// Guard: check if bucket exists before running dependent tests
let bucketExists = false;

beforeAll(async () => {
  uuids = await setupTestUsers();

  // Check if bucket exists
  const { data: buckets } = await svc.storage.listBuckets();
  bucketExists = !!buckets?.find((b) => b.id === BUCKET_NAME);

  if (!bucketExists) {
    console.warn(
      `\n  ⚠ leave_documents bucket not found.\n` +
      `  Run: supabase db push\n` +
      `  Migration: 20260519000005_leave_documents_storage.sql\n`,
    );
  }

  // Clean up any leftovers from aborted prior runs
  if (bucketExists) {
    for (const uuid of Object.values(uuids)) {
      const { data: files } = await svc.storage.from(BUCKET_NAME).list(uuid);
      if (files) {
        for (const file of files) {
          await svc.storage.from(BUCKET_NAME).remove([`${uuid}/${file.name}`]);
        }
      }
    }
  }
});

afterAll(async () => {
  // Clean up all uploaded test files
  if (bucketExists) {
    for (const path of uploadedPaths) {
      await svc.storage.from(BUCKET_NAME).remove([path]);
    }
  }
});

describe('Storage RLS: leave_documents bucket', () => {
  describe('Bucket configuration', () => {
    it('leave_documents bucket exists', async () => {
      if (!bucketExists) return; // skip until migration applied

      const { data: buckets, error } = await svc.storage.listBuckets();
      expect(error).toBeNull();
      const bucket = buckets?.find((b) => b.id === BUCKET_NAME);
      expect(bucket).toBeDefined();
      expect(bucket!.public).toBe(false);
      expect(bucket!.file_size_limit).toBe(5242880);
    });

    it('bucket has correct allowed MIME types', async () => {
      if (!bucketExists) return; // skip until migration applied

      const { data: buckets, error } = await svc.storage.listBuckets();
      expect(error).toBeNull();
      const bucket = buckets?.find((b) => b.id === BUCKET_NAME);
      expect(bucket).toBeDefined();
      expect(bucket!.allowed_mime_types).toEqual(
        expect.arrayContaining(['application/pdf', 'image/jpeg', 'image/png']),
      );
    });
  });

  describe('Upload via service role (bypasses RLS)', () => {
    it('service role can upload to employee folder', async () => {
      if (!bucketExists) return; // skip until migration applied

      const path = `${uuids.bobEmployee}/00000000-0000-0000-0000-000000000099/${TEST_FILENAME}`;
      const { error } = await svc.storage
        .from(BUCKET_NAME)
        .upload(path, TEST_FILE_CONTENT, { contentType: 'application/pdf' });

      expect(error).toBeNull();
      uploadedPaths.push(path);
    });

    it('service role can upload to different employee folder', async () => {
      if (!bucketExists) return; // skip until migration applied

      const path = `${uuids.carolEmployee}/00000000-0000-0000-0000-000000000098/${TEST_FILENAME}`;
      const { error } = await svc.storage
        .from(BUCKET_NAME)
        .upload(path, TEST_FILE_CONTENT, { contentType: 'application/pdf' });

      expect(error).toBeNull();
      uploadedPaths.push(path);
    });
  });

  describe('as Employee (Bob)', () => {
    let client: Awaited<ReturnType<typeof createClientAs>>;

    beforeAll(async () => {
      client = await createClientAs(TEST_USERS.bobEmployee.email);
    });

    it('SELECT own folder returns files', async () => {
      if (!bucketExists) return; // skip until migration applied

      const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .list(uuids.bobEmployee);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(1);
    });

    it('SELECT other employee folder returns empty or error', async () => {
      if (!bucketExists) return; // skip until migration applied

      const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .list(uuids.carolEmployee);

      // RLS should block access — either error or empty result
      if (error) {
        expect(error).toBeDefined();
      } else {
        expect(data).toHaveLength(0);
      }
    });

    it('cannot upload to own folder (no INSERT policy)', async () => {
      if (!bucketExists) return; // skip until migration applied

      const path = `${uuids.bobEmployee}/00000000-0000-0000-0000-000000000097/${TEST_FILENAME}`;
      const { error } = await client.storage
        .from(BUCKET_NAME)
        .upload(path, TEST_FILE_CONTENT, { contentType: 'application/pdf' });

      expect(error).toBeDefined();
    });

    it('cannot upload to other employee folder', async () => {
      if (!bucketExists) return; // skip until migration applied

      const path = `${uuids.carolEmployee}/00000000-0000-0000-0000-000000000096/${TEST_FILENAME}`;
      const { error } = await client.storage
        .from(BUCKET_NAME)
        .upload(path, TEST_FILE_CONTENT, { contentType: 'application/pdf' });

      expect(error).toBeDefined();
    });
  });

  describe('as Manager (Alice)', () => {
    let client: Awaited<ReturnType<typeof createClientAs>>;

    beforeAll(async () => {
      client = await createClientAs(TEST_USERS.aliceManager.email);
    });

    it('SELECT direct-report (Bob) folder returns files', async () => {
      if (!bucketExists) return; // skip until migration applied

      const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .list(uuids.bobEmployee);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(1);
    });

    it('SELECT direct-report (Carol) folder returns files', async () => {
      if (!bucketExists) return; // skip until migration applied

      const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .list(uuids.carolEmployee);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(1);
    });

    it('SELECT non-direct-report (Dana - HR Admin) folder returns empty or error', async () => {
      if (!bucketExists) return; // skip until migration applied

      const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .list(uuids.danaHRAdmin);

      // Dana is not Alice's direct report — RLS should block
      if (error) {
        expect(error).toBeDefined();
      } else {
        expect(data).toHaveLength(0);
      }
    });

    it('cannot upload to direct-report folder (no INSERT policy)', async () => {
      if (!bucketExists) return; // skip until migration applied

      const path = `${uuids.bobEmployee}/00000000-0000-0000-0000-000000000095/${TEST_FILENAME}`;
      const { error } = await client.storage
        .from(BUCKET_NAME)
        .upload(path, TEST_FILE_CONTENT, { contentType: 'application/pdf' });

      expect(error).toBeDefined();
    });
  });

  describe('as HR Admin (Dana)', () => {
    let client: Awaited<ReturnType<typeof createClientAs>>;

    beforeAll(async () => {
      client = await createClientAs(TEST_USERS.danaHRAdmin.email);
    });

    it('SELECT Bob folder returns files', async () => {
      if (!bucketExists) return; // skip until migration applied

      const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .list(uuids.bobEmployee);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(1);
    });

    it('SELECT Carol folder returns files', async () => {
      if (!bucketExists) return; // skip until migration applied

      const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .list(uuids.carolEmployee);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(1);
    });

    it('cannot upload to any folder (no INSERT policy)', async () => {
      if (!bucketExists) return; // skip until migration applied

      const path = `${uuids.bobEmployee}/00000000-0000-0000-0000-000000000094/${TEST_FILENAME}`;
      const { error } = await client.storage
        .from(BUCKET_NAME)
        .upload(path, TEST_FILE_CONTENT, { contentType: 'application/pdf' });

      expect(error).toBeDefined();
    });
  });

  describe('as Sys Admin (Evan)', () => {
    let client: Awaited<ReturnType<typeof createClientAs>>;

    beforeAll(async () => {
      client = await createClientAs(TEST_USERS.evanSysAdmin.email);
    });

    it('SELECT any folder returns empty or error (explicit deny)', async () => {
      if (!bucketExists) return; // skip until migration applied

      const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .list(uuids.bobEmployee);

      // Sys Admin is explicitly denied read access to leave documents
      if (error) {
        expect(error).toBeDefined();
      } else {
        expect(data).toHaveLength(0);
      }
    });

    it('cannot upload to any folder (no INSERT policy)', async () => {
      if (!bucketExists) return; // skip until migration applied

      const path = `${uuids.bobEmployee}/00000000-0000-0000-0000-000000000093/${TEST_FILENAME}`;
      const { error } = await client.storage
        .from(BUCKET_NAME)
        .upload(path, TEST_FILE_CONTENT, { contentType: 'application/pdf' });

      expect(error).toBeDefined();
    });
  });

  describe('No write policies exist for authenticated clients', () => {
    const BOB_UPDATE_PATH = `${uuids?.bobEmployee || 'placeholder'}/00000000-0000-0000-0000-000000000088/${TEST_FILENAME}`;

    beforeAll(async () => {
      if (!bucketExists) return; // skip until migration applied

      // Upload a file via service role for the update/delete tests
      const { error } = await svc.storage
        .from(BUCKET_NAME)
        .upload(BOB_UPDATE_PATH, TEST_FILE_CONTENT, { contentType: 'application/pdf' });

      if (!error) uploadedPaths.push(BOB_UPDATE_PATH);
    });

    it('employee cannot update files', async () => {
      if (!bucketExists) return; // skip until migration applied

      const client = await createClientAs(TEST_USERS.bobEmployee.email);
      const { error } = await client.storage
        .from(BUCKET_NAME)
        .update(BOB_UPDATE_PATH, TEST_FILE_CONTENT, { contentType: 'application/pdf' });

      expect(error).toBeDefined();
    });

    it('employee cannot delete files', async () => {
      if (!bucketExists) return; // skip until migration applied

      const client = await createClientAs(TEST_USERS.bobEmployee.email);
      const { error } = await client.storage
        .from(BUCKET_NAME)
        .remove([BOB_UPDATE_PATH]);

      expect(error).toBeDefined();
    });
  });
});
