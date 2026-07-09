import { createClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

// Unique per-process to avoid conflicts from prior test runs
// (Supabase Auth identities are not fully cleaned up on user deletion).
const UID = Date.now().toString(36);

export const TEST_USERS = {
  aliceManager: {
    email: `manager+t${UID}@stratpoint.com`,
    name: 'Alice Manager',
    role: 'manager' as const,
    department: 'Engineering',
  },
  bobEmployee: {
    email: `employee1+t${UID}@stratpoint.com`,
    name: 'Bob Employee',
    role: 'employee' as const,
    department: 'Engineering',
  },
  carolEmployee: {
    email: `employee2+t${UID}@stratpoint.com`,
    name: 'Carol Employee',
    role: 'employee' as const,
    department: 'Engineering',
  },
  danaHRAdmin: {
    email: `hr+t${UID}@stratpoint.com`,
    name: 'Dana HRAdmin',
    role: 'hr_admin' as const,
    department: 'HR',
  },
  evanSysAdmin: {
    email: `sysadmin+t${UID}@stratpoint.com`,
    name: 'Evan SysAdmin',
    role: 'sys_admin' as const,
    department: 'IT',
  },
} as const;

export type TestUserKey = keyof typeof TEST_USERS;

const CLIENT_OPTIONS = {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: WebSocket },
};

export function createServiceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CLIENT_OPTIONS);
}

export function createAnonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, CLIENT_OPTIONS);
}

const clientCache = new Map<string, SupabaseClient>();

// Rate-limit protection for Supabase Auth API (staging)
const AUTH_DELAY_MS = 1500;
let lastAuthCallTime = 0;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttleAuthCall(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastAuthCallTime;
  if (elapsed < AUTH_DELAY_MS) {
    await delay(AUTH_DELAY_MS - elapsed);
  }
  lastAuthCallTime = Date.now();
}

async function retryOnRateLimit<T>(
  fn: () => Promise<{ data: T | null; error: { message: string } | null }>,
  maxRetries = 3,
): Promise<{ data: T | null; error: { message: string } | null }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await fn();
    if (
      !result.error ||
      !result.error.message.toLowerCase().includes('rate limit')
    ) {
      return result;
    }
    if (attempt < maxRetries) {
      await delay((attempt + 1) * 2000);
    }
  }
  return fn();
}

export async function createClientAs(email: string): Promise<SupabaseClient> {
  const cached = clientCache.get(email);
  if (cached) return cached;

  const svc = createServiceClient();

  await throttleAuthCall();
  const { data: linkData, error: linkError } = await retryOnRateLimit(() =>
    svc.auth.admin.generateLink({ type: 'magiclink', email }),
  );
  if (linkError) throw linkError;

  await throttleAuthCall();
  const anonClient = createAnonClient();
  const { data: authData, error: authError } = await retryOnRateLimit(() =>
    anonClient.auth.verifyOtp({
      email,
      token: linkData.properties.email_otp,
      type: 'email',
    }),
  );
  if (authError) throw authError;

  if (authData.session) {
    await anonClient.auth.setSession(authData.session);
  }

  clientCache.set(email, anonClient);
  return anonClient;
}

export async function setupTestUsers(): Promise<Record<TestUserKey, string>> {
  const svc = createServiceClient();
  const uuidMap = {} as Record<TestUserKey, string>;

  async function createOrGetAuthUser(email: string): Promise<string> {
    const { data, error } = await svc.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (data?.user?.id) return data.user.id;

    const { data: users } = await svc.auth.admin.listUsers();
    const found = users?.users?.find((u) => u.email === email);
    if (found?.id) return found.id;
    throw new Error(`Cannot find or create auth user: ${email}`);
  }

  uuidMap.aliceManager = await createOrGetAuthUser(TEST_USERS.aliceManager.email);
  uuidMap.bobEmployee = await createOrGetAuthUser(TEST_USERS.bobEmployee.email);
  uuidMap.carolEmployee = await createOrGetAuthUser(TEST_USERS.carolEmployee.email);
  uuidMap.danaHRAdmin = await createOrGetAuthUser(TEST_USERS.danaHRAdmin.email);
  uuidMap.evanSysAdmin = await createOrGetAuthUser(TEST_USERS.evanSysAdmin.email);

  const profileRows: Array<{
    id: string;
    email: string;
    full_name: string;
    role: string;
    manager_id: string | null;
    department: string;
  }> = [
    {
      id: uuidMap.aliceManager,
      email: TEST_USERS.aliceManager.email,
      full_name: TEST_USERS.aliceManager.name,
      role: 'manager',
      manager_id: null,
      department: 'Engineering',
    },
    {
      id: uuidMap.bobEmployee,
      email: TEST_USERS.bobEmployee.email,
      full_name: TEST_USERS.bobEmployee.name,
      role: 'employee',
      manager_id: uuidMap.aliceManager,
      department: 'Engineering',
    },
    {
      id: uuidMap.carolEmployee,
      email: TEST_USERS.carolEmployee.email,
      full_name: TEST_USERS.carolEmployee.name,
      role: 'employee',
      manager_id: uuidMap.aliceManager,
      department: 'Engineering',
    },
    {
      id: uuidMap.danaHRAdmin,
      email: TEST_USERS.danaHRAdmin.email,
      full_name: TEST_USERS.danaHRAdmin.name,
      role: 'hr_admin',
      manager_id: null,
      department: 'HR',
    },
    {
      id: uuidMap.evanSysAdmin,
      email: TEST_USERS.evanSysAdmin.email,
      full_name: TEST_USERS.evanSysAdmin.name,
      role: 'sys_admin',
      manager_id: null,
      department: 'IT',
    },
  ];

  for (const row of profileRows) {
    const { error } = await svc.from('profiles').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  return uuidMap;
}
