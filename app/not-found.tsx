import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md text-center">
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <span className="text-3xl font-bold text-muted-foreground">404</span>
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-foreground">Page not found</h1>
          <p className="mb-6 text-muted-foreground">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
