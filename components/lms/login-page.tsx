'use client';

// @stratpoint.com domain restriction deferred for training project.
// In production, enable Supabase Auth email domain allow-list and
// restore client-side validation before calling signInWithOtp.

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Mail, CheckCircle2, AlertCircle, Loader2, Shield } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [touched, setTouched] = useState(false);

  function handleEmailChange(value: string) {
    setEmail(value);
    if (state === 'error') setState('idle');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);

    if (!email) {
      setState('error');
      setErrorMessage('Please enter your email address.');
      return;
    }

    setState('sending');
    setErrorMessage('');

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setState('error');
      setErrorMessage(error.message);
      return;
    }

    setState('sent');
  }

  function handleReset() {
    setEmail('');
    setState('idle');
    setErrorMessage('');
    setTouched(false);
  }

  if (state === 'sent') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary/50 to-background p-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl border bg-card p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-foreground">Check your inbox</h1>
            <p className="mb-2 text-muted-foreground">
              A magic link has been sent to <strong className="text-foreground">{email}</strong>.
              Click the link to sign in.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-4 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring/20 rounded"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary/50 to-background p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">LeaveTrack</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Leave Management System
            </p>
          </div>

          <form onSubmit={handleSubmit} aria-label="Sign in form" noValidate>
            <div className="mb-4">
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Work Email Address
              </label>
              <div className="relative">
                <Mail
                  className={cn(
                    'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground',
                    touched && email.length > 0 && 'text-emerald-600',
                    state === 'error' && errorMessage && 'text-destructive',
                  )}
                />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="you@example.com"
                  disabled={state === 'sending'}
                  autoComplete="email"
                  aria-invalid={state === 'error' && errorMessage ? true : undefined}
                  aria-describedby={state === 'error' && errorMessage ? 'email-error' : undefined}
                  className={cn(
                    'flex h-11 w-full rounded-lg border bg-input-background px-4 pl-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors',
                    'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    state === 'error' && errorMessage && 'border-destructive focus:border-destructive focus:ring-destructive/20',
                    touched && email.length > 0 && !errorMessage && 'border-emerald-500',
                  )}
                />
              </div>
            </div>

            {state === 'error' && errorMessage && (
              <div
                role="alert"
                className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={state === 'sending'}
              className={cn(
                'flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors',
                'hover:bg-primary/90',
                'focus:outline-none focus:ring-2 focus:ring-ring/20',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              {state === 'sending' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send magic link'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
