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

  // 1. We create a generic next response solely to capture cookie mutations
  let response = NextResponse.next();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 2. Exchange the code for a fresh token session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin));
  }

  // Domain restriction enforcement
  const email = data.user.email?.toLowerCase() ?? '';
  if (!email.endsWith(STRATPOINT_DOMAIN)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/login?error=domain_restricted', origin));
  }

  // Role routing lookup
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single<{ role: string }>();

  if (!profile?.role) {
    return NextResponse.redirect(new URL('/login?error=profile_not_found', origin));
  }

  const target = roleToDashboard[profile.role] ?? '/employee';

  // 3. Create our final dashboard destination redirect response
  const finalRedirect = NextResponse.redirect(new URL(target, origin));

  // 4. CRITICAL STEP: Copy all generated session cookies over to the final headers
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      finalRedirect.headers.append('set-cookie', value);
    }
  });

  return finalRedirect;
}