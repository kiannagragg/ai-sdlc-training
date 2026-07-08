import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database, UserRole } from '@/types/supabase';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

const ALLOWED_EMPLOYEE: UserRole[] = ['employee', 'manager', 'hr_admin', 'sys_admin'];
const ALLOWED_MANAGER: UserRole[]  = ['manager', 'hr_admin', 'sys_admin'];
const ALLOWED_ADMIN: UserRole[]    = ['hr_admin'];
const ALLOWED_ADMIN_USERS: UserRole[] = ['sys_admin'];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── Excluded paths ──────────────────────────────────────────────────
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // ── Supabase client (Edge Runtime — NextRequest / NextResponse cookies) ──
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // ── Auth check (server-validated JWT — not local cookie read) ──────
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Domain enforcement (server-side, defense in depth) ─────────────
  const email = user.email?.toLowerCase() ?? '';
  if (!email.endsWith('@stratpoint.com')) {
    await supabase.auth.signOut();
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'domain_restricted');
    return NextResponse.redirect(loginUrl);
  }

  // ── Role lookup (DB query, not JWT claim) ──────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: UserRole }>();

  if (!profile?.role) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'profile_not_found');
    return NextResponse.redirect(loginUrl);
  }

  const role = profile.role as UserRole;

  // ── Route enforcement (most-specific path first) ────────────────────
  // /admin/users[/...] — sys_admin only (bare path + sub-paths)
  if (pathname === '/admin/users' || pathname.startsWith('/admin/users/')) {
    if (!ALLOWED_ADMIN_USERS.includes(role)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return supabaseResponse;
  }

  // /admin[/...] — hr_admin or sys_admin (bare path + sub-paths)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!ALLOWED_ADMIN.includes(role)) {
      if (role === 'employee') {
        return NextResponse.redirect(new URL('/employee', request.url));
      }
      if (role === 'manager') {
        return NextResponse.redirect(new URL('/manager', request.url));
      }
      if (role === 'sys_admin') {
        return NextResponse.redirect(new URL('/sysadmin', request.url));
      }
    }
    return supabaseResponse;
  }

  // /manager[/...] — manager, hr_admin, or sys_admin (bare path + sub-paths)
  if (pathname === '/manager' || pathname.startsWith('/manager/')) {
    if (!ALLOWED_MANAGER.includes(role)) {
      return NextResponse.redirect(new URL('/employee', request.url));
    }
    return supabaseResponse;
  }

  // /employee[/...] — all four roles pass (bare path + sub-paths)
  if (pathname === '/employee' || pathname.startsWith('/employee/')) {
    if (!ALLOWED_EMPLOYEE.includes(role)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return supabaseResponse;
  }

  // /sysadmin[/...] — sys_admin only (bare path + sub-paths)
  if (pathname === '/sysadmin' || pathname.startsWith('/sysadmin/')) {
    if (role !== 'sys_admin') {
      if (role === 'employee') {
        return NextResponse.redirect(new URL('/employee', request.url));
      }
      if (role === 'manager') {
        return NextResponse.redirect(new URL('/manager', request.url));
      }
      if (role === 'hr_admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
    return supabaseResponse;
  }

  // ── Unmatched paths pass through ────────────────────────────────────
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
