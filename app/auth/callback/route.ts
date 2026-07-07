import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

const STRATPOINT_DOMAIN = '@stratpoint.com';

const roleToDashboard: Record<string, string> = {
  employee: '/employee',
  manager: '/manager',
  hr_admin: '/admin',
  sys_admin: '/sysadmin',
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', origin));
  }

  // Build response first so we can attach cookies to it
  const redirectResponse = NextResponse.redirect(new URL('/employee', origin));

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write cookies to BOTH the request and the redirect response
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin));
  }

  // Domain restriction
  const email = data.user.email?.toLowerCase() ?? '';
  if (!email.endsWith(STRATPOINT_DOMAIN)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login?error=domain_restricted', origin));
  }

  // Role lookup
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single<{ role: string }>();

  if (!profile?.role) {
    return NextResponse.redirect(new URL('/login?error=profile_not_found', origin));
  }

  const target = roleToDashboard[profile.role] ?? '/employee';

  // Update the redirect URL to the correct dashboard
  return NextResponse.redirect(new URL(target, origin), {
    headers: redirectResponse.headers,
  });
}