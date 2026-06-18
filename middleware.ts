import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ['/_next/static', '/_next/image', '/favicon.ico'];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = pathname === '/login';
  const isAuthCallback = pathname.startsWith('/callback');

  if (isAuthCallback) {
    return supabaseResponse;
  }

  if (!user) {
    if (isLoginPage) {
      return supabaseResponse;
    }
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const role = session?.user?.user_metadata?.role ?? 'employee';

  const roleRoutes: Record<string, string[]> = {
    employee: ['/employee'],
    manager: ['/manager'],
    hr_admin: ['/admin'],
    sys_admin: ['/sysadmin'],
  };

  if (isLoginPage) {
    const dashboard = roleRoutes[role]?.[0] ?? '/employee';
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  for (const [allowedRole, prefixes] of Object.entries(roleRoutes)) {
    for (const prefix of prefixes) {
      if (pathname.startsWith(prefix) && role !== allowedRole) {
        const dashboard = roleRoutes[role]?.[0] ?? '/employee';
        return NextResponse.redirect(new URL(dashboard, request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|callback).*)',
  ],
};
