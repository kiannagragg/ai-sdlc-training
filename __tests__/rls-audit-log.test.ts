/*
 * TASK-016 — Integration Tests for RLS Policies
 *
 * Tests: audit_log table
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

import { createServiceClient, createClientAs, setupTestUsers, TEST_USERS } from './helpers/supabase';

jest.setTimeout(60000);

const svc = createServiceClient();

const AUDIT_ROW_ID = '00000000-0000-0000-0000-000000000010';

let uuids: Record<string, string>;

beforeAll(async () => {
  uuids = await setupTestUsers();
});

afterAll(async () => {
  await svc.from('audit_log').delete().eq('id', AUDIT_ROW_ID);
});

async function insertAuditRow(): Promise<void> {
  await svc.from('audit_log').insert({
    id: AUDIT_ROW_ID,
    table_name: 'leaves',
    record_id: '00000000-0000-0000-0000-000000000000',
    action: 'SUBMITTED',
    actor_id: uuids.bobEmployee,
    old_data: null,
    new_data: { test: true },
  });
}

describe('RLS: audit_log table', () => {
  describe('DELETE audit_log — all roles', () => {
    beforeEach(async () => {
      await insertAuditRow();
    });

    afterEach(async () => {
      await svc.from('audit_log').delete().eq('id', AUDIT_ROW_ID);
    });

    const roles: Array<{ label: string; key: keyof typeof TEST_USERS }> = [
      { label: 'Employee', key: 'bobEmployee' },
      { label: 'Manager', key: 'aliceManager' },
      { label: 'HR Admin', key: 'danaHRAdmin' },
      { label: 'Sys Admin', key: 'evanSysAdmin' },
    ];

    for (const { label, key } of roles) {
      it(`as ${label} DELETE returns 0 rows`, async () => {
        const client = await createClientAs(TEST_USERS[key].email);
        const { data, error } = await client
          .from('audit_log')
          .delete()
          .eq('id', AUDIT_ROW_ID);

        expect(error).toBeNull();
        expect(data == null || data.length === 0).toBe(true);
      });
    }
  });

  describe('INSERT audit_log — all roles', () => {
    const roles: Array<{ label: string; key: keyof typeof TEST_USERS }> = [
      { label: 'Employee', key: 'bobEmployee' },
      { label: 'Manager', key: 'aliceManager' },
      { label: 'HR Admin', key: 'danaHRAdmin' },
      { label: 'Sys Admin', key: 'evanSysAdmin' },
    ];

    for (const { label, key } of roles) {
      it(`as ${label} INSERT returns RLS error`, async () => {
        const client = await createClientAs(TEST_USERS[key].email);
        const { error } = await client
          .from('audit_log')
          .insert({
            table_name: 'leaves',
            record_id: '00000000-0000-0000-0000-000000000000',
            action: 'SUBMITTED',
            actor_id: uuids[key],
            old_data: null,
            new_data: { test: true },
          });

        expect(error).not.toBeNull();
      });
    }
  });
});
