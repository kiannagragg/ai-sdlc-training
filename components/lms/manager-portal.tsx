'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { PortalView } from '@/components/lms/types';
import {
  ALL_REQUESTS,
  PENDING_APPROVALS,
} from '@/components/lms/mock-data';
import { StatusBadge, LeaveTypeBadge } from '@/components/lms/status-badge';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCheck,
  CalendarDays,
  User,
  MessageSquare,
  Clock,
} from 'lucide-react';

interface ManagerPortalProps {
  onViewChange?: (view: PortalView) => void;
}

type ManagerView = 'approvals' | 'calendar';

const STATUS_COLORS: Record<string, string> = {
  'Annual Leave': 'bg-blue-500',
  'Sick Leave': 'bg-red-500',
  'Emergency Leave': 'bg-amber-500',
  'Unpaid Leave': 'bg-gray-500',
  'Paternity/Maternity Leave': 'bg-purple-500',
};

export function ManagerPortal({ onViewChange }: ManagerPortalProps) {
  const [view, setView] = useState<ManagerView>('approvals');

  function handleViewChange(newView: ManagerView) {
    setView(newView);
    onViewChange?.(newView as PortalView);
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-1 rounded-lg bg-secondary/50 p-1">
        <button
          type="button"
          onClick={() => handleViewChange('approvals')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            view === 'approvals' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <CheckCheck className="h-4 w-4" />
          Approvals
        </button>
        <button
          type="button"
          onClick={() => handleViewChange('calendar')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            view === 'calendar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <CalendarDays className="h-4 w-4" />
          Calendar
        </button>
      </div>

      {view === 'approvals' && <ApprovalsView />}
      {view === 'calendar' && <CalendarView />}
    </div>
  );
}

function ApprovalsView() {
  const [approvals, setApprovals] = useState(() => [...PENDING_APPROVALS]);
  const [loading, setLoading] = useState(false);
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const approvalCards = approvals;

  async function handleApprove(id: string) {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    toast.success('Request approved', { description: 'The leave request has been approved.' });
    setLoading(false);
  }

  function handleReject(id: string) {
    setRejectDialog(id);
  }

  async function confirmReject() {
    if (!rejectDialog || !rejectReason.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setApprovals((prev) => prev.filter((a) => a.id !== rejectDialog));
    setRejectDialog(null);
    setRejectReason('');
    toast.error('Request rejected', { description: 'The leave request has been rejected.' });
    setLoading(false);
  }

  if (approvalCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="mb-1 text-lg font-semibold text-foreground">All caught up!</h2>
        <p className="text-sm text-muted-foreground">No pending approvals at the moment.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">
        Pending Approvals
        <span className="ml-2 text-sm font-normal text-muted-foreground">({approvalCards.length})</span>
      </h1>

      <div className="space-y-4">
        {approvalCards.map((card) => (
          <div
            key={card.id}
            className="rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary shrink-0">
                  {card.employeeName.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <span className="font-medium text-foreground">{card.employeeName}</span>
                    <LeaveTypeBadge type={card.leaveType} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {card.startDate} - {card.endDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {card.days} day{card.days > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {card.reason.length > 40 ? `${card.reason.slice(0, 40)}...` : card.reason}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 sm:flex-col">
                <button
                  type="button"
                  onClick={() => handleApprove(card.id)}
                  disabled={loading}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors',
                    'hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(card.id)}
                  disabled={loading}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive transition-colors',
                    'hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive/30',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                >
                  <XCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Reject</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rejectDialog && (
        <>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setRejectDialog(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-lg" role="dialog" aria-modal="true" aria-label="Reject request">
            <h2 className="mb-1 text-lg font-semibold text-foreground">Reject Request</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Provide a reason for rejection. This will be shared with the employee.
            </p>
            <div className="relative">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                maxLength={300}
                placeholder="Enter rejection reason..."
                className="flex w-full rounded-lg border bg-input-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors resize-none focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              <span
                className={cn(
                  'absolute bottom-2 right-2 text-[10px]',
                  rejectReason.length < 10 ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {rejectReason.length}/300
              </span>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={confirmReject}
                disabled={!rejectReason.trim() || loading}
                className={cn(
                  'flex flex-1 items-center justify-center rounded-lg bg-destructive py-2 text-sm font-medium text-destructive-foreground',
                  'hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive/30',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Confirm Rejection'
                )}
              </button>
              <button
                type="button"
                onClick={() => setRejectDialog(null)}
                className="flex flex-1 items-center justify-center rounded-lg border py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CalendarView() {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const approvedLeaves = useMemo(
    () => ALL_REQUESTS.filter((r) => r.status === 'APPROVED'),
    [],
  );

  function getLeavesForDay(day: number) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return approvedLeaves.filter((r) => dateStr >= r.startDate && dateStr <= r.endDate);
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  const teamApprovedLeaves = useMemo(() => {
    return approvedLeaves.filter((r) =>
      r.employeeId === 'emp-001' || r.employeeId === 'emp-002' || r.employeeId === 'emp-003' || r.employeeId === 'emp-005',
    );
  }, [approvedLeaves]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Team Calendar</h1>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">{monthName}</h2>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px" role="grid" aria-label="Calendar">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="px-1 py-2 text-center text-[10px] font-medium text-muted-foreground sm:text-xs"
            >
              {d}
            </div>
          ))}

          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[60px] sm:min-h-[80px]" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const leaves = getLeavesForDay(day);
            const isToday =
              day === now.getDate() &&
              currentMonth === now.getMonth() &&
              currentYear === now.getFullYear();

            return (
              <div
                key={day}
                className={cn(
                  'min-h-[60px] border-t p-1 sm:min-h-[80px]',
                  isToday && 'bg-accent/50',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] sm:text-xs',
                    isToday ? 'bg-primary text-primary-foreground font-semibold' : 'text-foreground',
                  )}
                >
                  {day}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {leaves.slice(0, 3).map((l) => (
                    <div
                      key={l.id}
                      className={cn(
                        'h-1.5 w-full rounded-full sm:h-2',
                        STATUS_COLORS[l.leaveType] || 'bg-gray-400',
                      )}
                      title={`${l.employeeName} - ${l.leaveType}`}
                    />
                  ))}
                  {leaves.length > 3 && (
                    <span className="text-[8px] text-muted-foreground sm:text-[10px]">
                      +{leaves.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Approved Leaves This Month</h2>
        {teamApprovedLeaves.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">No approved leaves this month</p>
          </div>
        ) : (
          <div className="space-y-2">
            {teamApprovedLeaves.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                  {r.employeeName.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{r.employeeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.leaveType} &middot; {r.startDate} - {r.endDate}
                  </p>
                </div>
                <div className={cn('h-3 w-3 rounded-full', STATUS_COLORS[r.leaveType] || 'bg-gray-400')} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {Object.entries(STATUS_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={cn('h-2.5 w-2.5 rounded-full', color)} />
            <span className="text-[10px] text-muted-foreground">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
