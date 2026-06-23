import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', origin));
  }

  let supabase;

  try {
    supabase = await createClient();
  } catch {
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin));
  }

  let user;

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return NextResponse.redirect(new URL('/login?error=auth_failed', origin));
    }

    user = data.user;
  } catch {
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin));
  }

  let profile;

  try {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: string }>();

    profile = profileData;
  } catch {
    return NextResponse.redirect(new URL('/login?error=profile_not_found', origin));
  }

  if (!profile?.role) {
    return NextResponse.redirect(new URL('/login?error=profile_not_found', origin));
  }

  const roleToDashboard: Record<string, string> = {
    employee: '/employee',
    manager: '/manager',
    hr_admin: '/admin',
    sys_admin: '/sysadmin',
  };

  const target = roleToDashboard[profile.role] ?? '/employee';

  return NextResponse.redirect(new URL(target, origin));
}
