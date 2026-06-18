'use client';

import { useState, type FormEvent } from 'react';
import { cn } from '@/lib/utils';
import { Mail, CheckCircle2, ChevronDown, ChevronRight, AlertCircle, Loader2, Shield } from 'lucide-react';
import type { UserRole } from './types';

interface DemoAccount {
  role: UserRole;
  label: string;
  name: string;
  email: string;
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'employee',
    label: 'Employee',
    name: 'Miguel Santos',
    email: 'miguel.santos@stratpoint.com',
    description: 'Submit leave requests, view balances',
  },
  {
    role: 'manager',
    label: 'Line Manager',
    name: 'Ana Reyes',
    email: 'ana.reyes@stratpoint.com',
    description: 'Approve requests, view team calendar',
  },
  {
    role: 'hr_admin',
    label: 'HR Administrator',
    name: 'Carmen Ortiz',
    email: 'carmen.ortiz@stratpoint.com',
    description: 'Full org access, reports, audit log',
  },
  {
    role: 'sys_admin',
    label: 'System Administrator',
    name: 'Joel Reyes',
    email: 'joel.reyes@stratpoint.com',
    description: 'User and role management',
  },
];

interface LoginPageProps {
  onLogin?: (role: UserRole) => void;
}

export function LoginPage({ onLogin }: LoginPageProps = {}) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailError = touched && email.length > 0 && !email.endsWith('@stratpoint.com')
    ? 'Access denied. Only @stratpoint.com email addresses are permitted.'
    : '';

  function handleEmailChange(value: string) {
    setEmail(value);
    if (state === 'error') setState('idle');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);

    if (!email || !email.endsWith('@stratpoint.com')) {
      setState('error');
      setErrorMessage('Access denied. Only @stratpoint.com email addresses are permitted.');
      return;
    }

    setState('sending');
    setErrorMessage('');

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setState('sent');
  }

  function handleDemoClick(acc: DemoAccount) {
    if (onLogin) {
      onLogin(acc.role);
    } else {
      setEmail(acc.email);
      setTouched(true);
      setState('idle');
      setErrorMessage('');
    }
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
              A magic link has been sent to <strong className="text-foreground">{email}</strong>. Click the link to sign in.
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
            <h1 className="text-xl font-semibold text-foreground">Meridian Corp</h1>
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
                    email.length > 0 && !emailError && 'text-emerald-600',
                    emailError && 'text-destructive',
                  )}
                />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="username@stratpoint.com"
                  disabled={state === 'sending'}
                  autoComplete="email"
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  className={cn(
                    'flex h-11 w-full rounded-lg border bg-input-background px-4 pl-10 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors',
                    'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    emailError && 'border-destructive focus:border-destructive focus:ring-destructive/20',
                    email.length > 0 && !emailError && 'border-emerald-500',
                  )}
                />
              </div>
              {emailError && touched && (
                <p id="email-error" role="alert" className="mt-1.5 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {emailError}
                </p>
              )}
            </div>

            {state === 'error' && errorMessage && !emailError && (
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

        <div className="mt-4 rounded-xl border bg-card shadow-sm">
          <button
            type="button"
            onClick={() => setShowDemo(!showDemo)}
            className="flex w-full items-center justify-between px-6 py-4 text-sm font-medium text-foreground"
            aria-expanded={showDemo}
          >
            <span>Demo Accounts</span>
            {showDemo ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showDemo && (
            <div className="border-t px-6 pb-4 pt-3">
              <p className="mb-3 text-xs text-muted-foreground">
                Click an account to {onLogin ? 'simulate login' : 'auto-fill the email'}:
              </p>
              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleDemoClick(acc)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                      'hover:bg-accent hover:border-accent-foreground/20',
                      'focus:outline-none focus:ring-2 focus:ring-ring/20',
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
                      {acc.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{acc.name}</span>
                        <span className="text-[10px] rounded-md bg-secondary px-1.5 py-0.5 font-medium text-secondary-foreground whitespace-nowrap">
                          {acc.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{acc.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
