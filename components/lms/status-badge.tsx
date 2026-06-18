'use client';

import { cn } from '@/lib/utils';
import type { LeaveStatus, LeaveTypeName, AuditAction } from '@/components/lms/types';

interface StatusBadgeProps {
  status: LeaveStatus;
  className?: string;
}

const statusStyles: Record<LeaveStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
        className,
      )}
      aria-label={`Status: ${status}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

interface LeaveTypeBadgeProps {
  type: LeaveTypeName;
  className?: string;
}

const leaveTypeStyles: Record<LeaveTypeName, string> = {
  'Annual Leave': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Sick Leave': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Emergency Leave': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Unpaid Leave': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  'Paternity/Maternity Leave': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const leaveTypeDots: Record<LeaveTypeName, string> = {
  'Annual Leave': 'bg-blue-500',
  'Sick Leave': 'bg-red-500',
  'Emergency Leave': 'bg-orange-500',
  'Unpaid Leave': 'bg-gray-500',
  'Paternity/Maternity Leave': 'bg-purple-500',
};

export function LeaveTypeBadge({ type, className }: LeaveTypeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
        leaveTypeStyles[type],
        className,
      )}
      aria-label={`Leave type: ${type}`}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', leaveTypeDots[type])} aria-hidden="true" />
      {type}
    </span>
  );
}

interface AuditActionBadgeProps {
  action: AuditAction;
  className?: string;
}

const auditActionStyles: Record<AuditAction, string> = {
  SUBMITTED: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  OVERRIDDEN: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
};

export function AuditActionBadge({ action, className }: AuditActionBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wide',
        auditActionStyles[action],
        className,
      )}
      aria-label={`Action: ${action}`}
    >
      {action}
    </span>
  );
}
