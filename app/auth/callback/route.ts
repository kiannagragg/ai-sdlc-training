import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    return NextResponse.redirect(
      new URL('/login?error=missing_code', origin)
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  console.error('Exchange result:', { 
  error: error?.message, 
  errorCode: error?.code,
  hasUser: !!data?.user 
  });

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL('/login?error=auth_failed', origin)
    );
  }

  // Domain restriction check
  const email = data.user.email?.toLowerCase() ?? '';
  if (!email.endsWith(STRATPOINT_DOMAIN)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL('/login?error=domain_restricted', origin)
    );
  }

  // Role lookup
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single<{ role: string }>();

  if (!profile?.role) {
    return NextResponse.redirect(
      new URL('/login?error=profile_not_found', origin)
    );
  }

  const target = roleToDashboard[profile.role] ?? '/employee';
  return NextResponse.redirect(new URL(target, origin));
}