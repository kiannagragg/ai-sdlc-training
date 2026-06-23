// ⚠️ Server-only — never import in files with 'use client'.
// The service role key bypasses RLS and must never reach the browser bundle.

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const serviceClient = createClient<Database>(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
