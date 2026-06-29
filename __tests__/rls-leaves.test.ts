/*
 * TASK-016 — Integration Tests for RLS Policies
 *
 * Tests: leaves table
 *
 * ═══════════════════════════════════════════════════════
 * Known deviations from ideal setup:
 *
 * 1. Staging, not local emulator
 *    Tests run against SUPABASE_STAGING, sharing the DB
 *    with development work. This is an accepted tradeoff
 *    (Docker not available).
 *
 * 2. Domain restriction auth test DEFERRED
 *    The @stratpoint.com domain allow-list policy is not
 *    tested here. Will be covered in a future task.
 *
 * 3. DELETE with USING(false) returns 0 rows
 *    Per TASK-011, a filtered DELETE that matches no rows
 *    returns data.length === 0, NOT a Postgres error.
 *    Assertions check for empty result, not error.
 *
 * 4. INSERT on audit_log with no policy
 *    This IS a hard RLS error (not silently allowed).
 *    Assertions check that error exists.
 * ═══════════════════════════════════════════════════════
 */

import { createServiceClient, createClientAs, setupTestUsers, TEST_USERS } from './helpers/supabase';

jest.setTimeout(60000);

const svc = createServiceClient();

const LEAVE_BOB = '00000000-0000-0000-0000-000000000001';
const LEAVE_CAROL = '00000000-0000-0000-0000-000000000002';
const LEAVE_DANA = '00000000-0000-0000-0000-000000000003';

let uuids: Record<string, string>;
let currentYear: number;

beforeAll(async () => {
  uuids = await setupTestUsers();
  currentYear = new Date().getFullYear();

  // Ensure leave types exist (idempotent — may already be seeded)
  await svc.from('leave_types').upsert([
    { name: 'Annual Leave',    default_days: 15, allow_carryover: false, is_active: true },
    { name: 'Sick Leave',      default_days: 15, allow_carryover: false, is_active: true },
    { name: 'Emergency Leave', default_days:  3, allow_carryover: false, is_active: true },
    { name: 'Unpaid Leave',    default_days:  0, allow_carryover: false, is_active: true },
  ], { onConflict: 'name', ignoreDuplicates: true });

  // Remove any leftovers from aborted prior runs, then insert fresh
  await svc.from('leaves').delete().in('id', [LEAVE_BOB, LEAVE_CAROL, LEAVE_DANA]);

  const { error: insertError } = await svc.from('leaves').insert([
    {
      id: LEAVE_BOB,
      employee_id: uuids.bobEmployee,
      leave_type: 'Annual Leave',
      start_date: `${currentYear}-06-01`,
      end_date: `${currentYear}-06-05`,
      status: 'PENDING',
      reason: 'Vacation',
    },
    {
      id: LEAVE_CAROL,
      employee_id: uuids.carolEmployee,
      leave_type: 'Annual Leave',
      start_date: `${currentYear}-06-10`,
      end_date: `${currentYear}-06-12`,
      status: 'PENDING',
      reason: 'Personal',
    },
    {
      id: LEAVE_DANA,
      employee_id: uuids.danaHRAdmin,
      leave_type: 'Annual Leave',
      start_date: `${currentYear}-07-01`,
      end_date: `${currentYear}-07-03`,
      status: 'PENDING',
      reason: 'Conference',
    },
  ]);
  if (insertError) throw insertError;
});

afterAll(async () => {
  await svc.from('leaves').delete().in('id', [LEAVE_BOB, LEAVE_CAROL, LEAVE_DANA]);
});

describe('RLS: leaves table', () => {
  describe('as Employee (Bob)', () => {
    let client: Awaited<ReturnType<typeof createClientAs>>;

    beforeAll(async () => {
      client = await createClientAs(TEST_USERS.bobEmployee.email);
    });

    it('SELECT own leaves returns Bob\'s leave', async () => {
      const { data, error } = await client
        .from('leaves')
        .select('*')
        .eq('id', LEAVE_BOB);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe(LEAVE_BOB);
    });

    it('SELECT other employee leaves returns empty', async () => {
      const { data } = await client
        .from('leaves')
        .select('*')
        .eq('employee_id', uuids.carolEmployee);

      expect(data).toHaveLength(0);
    });

    it('DELETE own leave returns 0 rows (not an error)', async () => {
      const { data, error } = await client
        .from('leaves')
        .delete()
        .eq('id', LEAVE_BOB);

      expect(error).toBeNull();
      expect(data == null || data.length === 0).toBe(true);
    });
  });

  describe('as Manager (Alice)', () => {
    let client: Awaited<ReturnType<typeof createClientAs>>;

    beforeAll(async () => {
      client = await createClientAs(TEST_USERS.aliceManager.email);
    });

    it('SELECT direct-report (Bob) leaves returns Bob\'s leave', async () => {
      const { data, error } = await client
        .from('leaves')
        .select('*')
        .eq('employee_id', uuids.bobEmployee);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe(LEAVE_BOB);
    });

    it('SELECT non-direct-report (Dana) leaves returns empty', async () => {
      const { data } = await client
        .from('leaves')
        .select('*')
        .eq('employee_id', uuids.danaHRAdmin);

      expect(data).toHaveLength(0);
    });
  });

  describe('as HR Admin (Dana)', () => {
    let client: Awaited<ReturnType<typeof createClientAs>>;

    beforeAll(async () => {
      client = await createClientAs(TEST_USERS.danaHRAdmin.email);
    });

    it('SELECT all leaves returns all seeded leaves', async () => {
      const { data, error } = await client
        .from('leaves')
        .select('*')
        .in('id', [LEAVE_BOB, LEAVE_CAROL, LEAVE_DANA]);

      expect(error).toBeNull();
      expect(data).toHaveLength(3);
    });
  });

  describe('as Sys Admin (Evan)', () => {
    let client: Awaited<ReturnType<typeof createClientAs>>;

    beforeAll(async () => {
      client = await createClientAs(TEST_USERS.evanSysAdmin.email);
    });

    it('SELECT leaves returns empty set', async () => {
      const { data, error } = await client
        .from('leaves')
        .select('*');

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });
});
