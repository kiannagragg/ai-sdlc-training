'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const STRATPOINT_DOMAIN = '@stratpoint.com';

const roleToDashboard: Record<string, string> = {
  employee: '/employee',
  manager: '/manager',
  hr_admin: '/admin',
  sys_admin: '/sysadmin',
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'exchanging' | 'redirecting' | 'error'>('exchanging');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        setStatus('error');
        setErrorMessage(error.message);
        return;
      }

      if (!session?.user) {
        setStatus('error');
        setErrorMessage(
          'Could not verify your sign-in link. It may be expired or already used. Please request a new one.',
        );
        return;
      }

      const userEmail = session.user.email?.toLowerCase() ?? '';
      if (!userEmail.endsWith(STRATPOINT_DOMAIN)) {
        await supabase.auth.signOut();
        setStatus('error');
        setErrorMessage('Only @stratpoint.com email addresses are permitted.');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single<{ role: string }>();

      if (!profile?.role) {
        setStatus('error');
        setErrorMessage('Account not found. Please contact HR.');
        return;
      }

      setStatus('redirecting');
      const target = roleToDashboard[profile.role] ?? '/employee';
      router.replace(target);
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary/50 to-background p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-card p-8 shadow-sm text-center">
          {status === 'exchanging' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <h1 className="mb-2 text-xl font-semibold text-foreground">Signing you in...</h1>
              <p className="text-sm text-muted-foreground">Please wait while we verify your link.</p>
            </>
          )}

          {status === 'redirecting' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="mb-2 text-xl font-semibold text-foreground">Signed in!</h1>
              <p className="text-sm text-muted-foreground">Redirecting you to your dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="mb-2 text-xl font-semibold text-foreground">Authentication failed</h1>
              <p className="mb-4 text-sm text-muted-foreground">{errorMessage}</p>
              <button
                type="button"
                onClick={() => router.replace('/login')}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                Back to login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
