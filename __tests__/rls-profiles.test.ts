/*
 * TASK-016 — Integration Tests for RLS Policies
 *
 * Tests: profiles table
 *
 * ═══════════════════════════════════════════════════════
 * Known deviations from ideal setup:
 *
 * 1. Staging, not local emulator
 * 2. Domain restriction auth test DEFERRED
 * 3. DELETE with USING(false) returns 0 rows
 * 4. INSERT on audit_log with no policy IS a hard RLS error
 * ═══════════════════════════════════════════════════════
 */

import { createClientAs, setupTestUsers, TEST_USERS } from './helpers/supabase';

let uuids: Record<string, string>;

beforeAll(async () => {
  uuids = await setupTestUsers();
});

describe('RLS: profiles table', () => {
  describe('as Sys Admin (Evan)', () => {
    let client: Awaited<ReturnType<typeof createClientAs>>;

    beforeAll(async () => {
      client = await createClientAs(TEST_USERS.evanSysAdmin.email);
    });

    it('SELECT profiles returns at least the 5 test users', async () => {
      const { data, error } = await client
        .from('profiles')
        .select('*');

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(5);

      const testEmails = Object.values(TEST_USERS).map((u) => u.email);
      for (const email of testEmails) {
        expect(data!.some((p) => p.email === email)).toBe(true);
      }
    });
  });

  describe('as Employee (Bob)', () => {
    let client: Awaited<ReturnType<typeof createClientAs>>;

    beforeAll(async () => {
      client = await createClientAs(TEST_USERS.bobEmployee.email);
    });

    it('SELECT own profile returns 1 row (self only)', async () => {
      const { data, error } = await client
        .from('profiles')
        .select('*');

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe(uuids.bobEmployee);
    });
  });
});
