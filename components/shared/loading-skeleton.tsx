import { cn } from '@/lib/utils';
import type { UserRole } from '@/components/lms/types';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      aria-hidden="true"
    />
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="w-full space-y-3" role="status" aria-label="Loading table data">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, colIdx) => (
          <Skeleton key={`header-${colIdx}`} className="h-8 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={`row-${rowIdx}`} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={`cell-${rowIdx}-${colIdx}`}
              className="h-6 flex-1"
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 3 }: CardSkeletonProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading cards">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="mt-4 h-20 w-full" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-md" />
            <Skeleton className="h-8 flex-1 rounded-md" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface FormSkeletonProps {
  fields?: number;
}

export function FormSkeleton({ fields = 4 }: FormSkeletonProps) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full rounded-md" />
          {i === 0 && <Skeleton className="h-3 w-2/3" />}
        </div>
      ))}
      <Skeleton className="h-10 w-1/3 rounded-md" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface DashboardSkeletonProps {
  role?: UserRole;
}

export function DashboardSkeleton({ role = 'employee' }: DashboardSkeletonProps) {
  const isManager = role === 'manager' || role === 'hr_admin' || role === 'sys_admin';

  return (
    <div className="space-y-6" role="status" aria-label={`Loading ${role} dashboard`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`stat-${i}`} className="rounded-lg border p-4">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="mt-2 h-8 w-1/3" />
            <Skeleton className="mt-1 h-3 w-3/4" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-6">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="mt-4 h-40 w-full" />
        </div>
        <div className="rounded-lg border p-6">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="mt-4 h-40 w-full" />
        </div>
      </div>

      {isManager && (
        <div className="rounded-lg border p-6">
          <Skeleton className="h-5 w-1/4" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`approval-${i}`} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      )}

      <span className="sr-only">Loading dashboard...</span>
    </div>
  );
}
