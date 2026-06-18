'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { PortalView, LeaveTypeName, LeaveBalance, LeaveRequest } from '@/components/lms/types';
import {
  CURRENT_USER_EMPLOYEE,
  EMPLOYEE_BALANCES,
  MY_LEAVE_REQUESTS,
  LEAVE_TYPES,
} from '@/components/lms/mock-data';
import { StatusBadge, LeaveTypeBadge } from '@/components/lms/status-badge';
import {
  Sun,
  CloudMoon,
  Umbrella,
  HeartPulse,
  Baby,
  FileText,
  CalendarPlus,
  Clock,
  Calendar,
  Upload,
  X,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Inbox,
  ArrowUpDown,
} from 'lucide-react';

const leaveIcons: Record<LeaveTypeName, React.ElementType> = {
  'Annual Leave': Sun,
  'Sick Leave': HeartPulse,
  'Emergency Leave': Umbrella,
  'Unpaid Leave': CloudMoon,
  'Paternity/Maternity Leave': Baby,
};

interface EmployeePortalProps {
  onViewChange?: (view: PortalView) => void;
}

type EmployeeView = 'dashboard' | 'submit-request' | 'my-requests';

export function EmployeePortal({ onViewChange }: EmployeePortalProps) {
  const [view, setView] = useState<EmployeeView>('dashboard');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  function handleViewChange(newView: EmployeeView) {
    setView(newView);
    onViewChange?.(newView as PortalView);
  }

  const balances: LeaveBalance[] = useMemo(() => EMPLOYEE_BALANCES, []);

  const employeeRequests: LeaveRequest[] = useMemo(
    () => MY_LEAVE_REQUESTS.filter((r) => r.employeeId === CURRENT_USER_EMPLOYEE.id),
    [],
  );

  return (
    <div className="p-4 lg:p-6">
      {view === 'dashboard' && (
        <DashboardView
          balances={balances}
          onNavigate={handleViewChange}
        />
      )}
      {view === 'submit-request' && (
        <SubmitRequestView onBack={() => handleViewChange('dashboard')} />
      )}
      {view === 'my-requests' && (
        <MyRequestsView
          requests={employeeRequests}
          selectedRequest={selectedRequest}
          onSelectRequest={setSelectedRequest}
          onBack={() => handleViewChange('dashboard')}
        />
      )}
    </div>
  );
}

function DashboardView({
  balances,
  onNavigate,
}: {
  balances: LeaveBalance[];
  onNavigate: (view: EmployeeView) => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome back, {CURRENT_USER_EMPLOYEE.fullName.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {CURRENT_USER_EMPLOYEE.department} &middot; {CURRENT_USER_EMPLOYEE.office}
        </p>
      </div>

      <h2 className="mb-3 text-sm font-medium text-foreground">Leave Balances</h2>
      {balances.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No leave balances found</p>
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {balances.map((b) => {
            const Icon = leaveIcons[b.leaveType] || FileText;
            const pct = b.total > 0 ? Math.round((b.used / b.total) * 100) : 0;
            return (
              <div
                key={b.leaveType}
                className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{b.leaveType}</span>
                </div>
                <div className="mb-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">{b.remaining}</span>
                  <span className="text-xs text-muted-foreground">/ {b.total} days</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      pct > 80 ? 'bg-destructive' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">{b.used} used</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onNavigate('submit-request')}
          className={cn(
            'flex items-center gap-4 rounded-xl border bg-card p-5 text-left transition-all hover:shadow-md',
            'focus:outline-none focus:ring-2 focus:ring-ring/20',
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <CalendarPlus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Submit Leave Request</p>
            <p className="text-sm text-muted-foreground">Apply for time off</p>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('my-requests')}
          className={cn(
            'flex items-center gap-4 rounded-xl border bg-card p-5 text-left transition-all hover:shadow-md',
            'focus:outline-none focus:ring-2 focus:ring-ring/20',
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <FileText className="h-6 w-6 text-secondary-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">View My Requests</p>
            <p className="text-sm text-muted-foreground">Track your leave history</p>
          </div>
          <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

function SubmitRequestView({ onBack }: { onBack: () => void }) {
  const [leaveType, setLeaveType] = useState<LeaveTypeName | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!leaveType) errs.leaveType = 'Select a leave type';
    if (!startDate) errs.startDate = 'Select a start date';
    if (!endDate) errs.endDate = 'Select an end date';
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      errs.endDate = 'End date must be after start date';
    }
    if (!reason || reason.length < 10) errs.reason = 'Reason must be at least 10 characters';
    if (file && file.size > 5 * 1024 * 1024) errs.file = 'File must be under 5MB';
    if (file && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      errs.file = 'Only PDF and image files are allowed';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="mb-1 text-xl font-semibold text-foreground">Request Submitted</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Your leave request has been sent to your manager for approval.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setLeaveType('');
              setStartDate('');
              setEndDate('');
              setReason('');
              setFile(null);
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Submit another
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        Back to Dashboard
      </button>

      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-foreground">Submit Leave Request</h1>

        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <div>
            <label htmlFor="leave-type" className="mb-1.5 block text-sm font-medium text-foreground">
              Leave Type
            </label>
            <select
              id="leave-type"
              value={leaveType}
              onChange={(e) => { setLeaveType(e.target.value as LeaveTypeName); setErrors((prev) => ({ ...prev, leaveType: '' })); }}
              className={cn(
                'flex h-11 w-full rounded-lg border bg-input-background px-3 text-sm text-foreground transition-colors',
                'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
                errors.leaveType && 'border-destructive focus:border-destructive',
              )}
              aria-invalid={!!errors.leaveType}
            >
              <option value="">Select leave type</option>
              {LEAVE_TYPES.filter((t) => t.isActive).map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
            {errors.leaveType && (
              <p role="alert" className="mt-1 text-xs text-destructive">{errors.leaveType}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start-date" className="mb-1.5 block text-sm font-medium text-foreground">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setErrors((prev) => ({ ...prev, startDate: '' })); }}
                className={cn(
                  'flex h-11 w-full rounded-lg border bg-input-background px-3 text-sm text-foreground transition-colors',
                  'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
                  errors.startDate && 'border-destructive',
                )}
                aria-invalid={!!errors.startDate}
              />
              {errors.startDate && (
                <p role="alert" className="mt-1 text-xs text-destructive">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label htmlFor="end-date" className="mb-1.5 block text-sm font-medium text-foreground">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setErrors((prev) => ({ ...prev, endDate: '' })); }}
                className={cn(
                  'flex h-11 w-full rounded-lg border bg-input-background px-3 text-sm text-foreground transition-colors',
                  'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
                  errors.endDate && 'border-destructive',
                )}
                aria-invalid={!!errors.endDate}
              />
              {errors.endDate && (
                <p role="alert" className="mt-1 text-xs text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-foreground">
              Reason
            </label>
            <div className="relative">
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => { setReason(e.target.value); setErrors((prev) => ({ ...prev, reason: '' })); }}
                rows={4}
                maxLength={500}
                className={cn(
                  'flex w-full rounded-lg border bg-input-background px-3 py-2.5 text-sm text-foreground transition-colors resize-none',
                  'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20',
                  errors.reason && 'border-destructive',
                )}
                aria-invalid={!!errors.reason}
              />
              <span
                className={cn(
                  'absolute bottom-2 right-2 text-[10px]',
                  reason.length < 10 ? 'text-destructive' : reason.length < 50 ? 'text-muted-foreground' : 'text-emerald-600',
                )}
              >
                {reason.length}/500
              </span>
            </div>
            {errors.reason && (
              <p role="alert" className="mt-1 text-xs text-destructive">{errors.reason}</p>
            )}
          </div>

          <div>
            <label htmlFor="file-upload" className="mb-1.5 block text-sm font-medium text-foreground">
              Supporting Document (optional)
            </label>
            <div
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-colors',
                file ? 'border-emerald-500 bg-emerald-50/50' : 'border-muted-foreground/30 hover:border-muted-foreground/50',
                errors.file && 'border-destructive bg-destructive/5',
              )}
            >
              {file ? (
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drop a file or <span className="font-medium text-primary">browse</span>
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">PDF or image, max 5MB</p>
                </>
              )}
              <input
                id="file-upload"
                type="file"
                accept=".pdf,image/jpeg,image/png"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  setErrors((prev) => ({ ...prev, file: '' }));
                }}
              />
            </div>
            {errors.file && (
              <p role="alert" className="mt-1 text-xs text-destructive">{errors.file}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={cn(
                'flex h-11 flex-1 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground',
                'hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/20',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 flex-1 items-center justify-center rounded-lg border text-sm font-medium text-foreground hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyRequestsView({
  requests,
  selectedRequest,
  onSelectRequest,
  onBack,
}: {
  requests: LeaveRequest[];
  selectedRequest: string | null;
  onSelectRequest: (id: string | null) => void;
  onBack: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchTerm && !r.leaveType.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [requests, statusFilter, searchTerm]);

  const detail = selectedRequest ? requests.find((r) => r.id === selectedRequest) : null;

  if (detail) {
    return (
      <div>
        <button
          type="button"
          onClick={() => onSelectRequest(null)}
          className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to My Requests
        </button>

        <div className="mx-auto max-w-xl rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{detail.leaveType}</h2>
              <p className="text-sm text-muted-foreground">Request {detail.id}</p>
            </div>
            <StatusBadge status={detail.status} />
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Start Date</dt>
              <dd className="font-medium text-foreground">{detail.startDate}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">End Date</dt>
              <dd className="font-medium text-foreground">{detail.endDate}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Duration</dt>
              <dd className="font-medium text-foreground">{detail.days} day{detail.days > 1 ? 's' : ''}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="font-medium text-foreground">{new Date(detail.submittedDate).toLocaleDateString()}</dd>
            </div>
            <div className="border-t pt-3">
              <dt className="mb-1 text-muted-foreground">Reason</dt>
              <dd className="text-foreground">{detail.reason}</dd>
            </div>
            {detail.managerNote && (
              <div className="border-t pt-3">
                <dt className="mb-1 text-muted-foreground">Manager Note</dt>
                <dd className="text-foreground">{detail.managerNote}</dd>
              </div>
            )}
            {detail.rejectionReason && (
              <div className="border-t pt-3">
                <dt className="mb-1 text-muted-foreground">Rejection Reason</dt>
                <dd className="text-destructive">{detail.rejectionReason}</dd>
              </div>
            )}
          </dl>

          {detail.status === 'PENDING' && (
            <button
              type="button"
              className="mt-6 w-full rounded-lg border border-destructive/50 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              Cancel Request
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        Back to Dashboard
      </button>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-foreground">My Requests</h1>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by leave type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-lg border bg-input-background px-4 pl-9 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-lg border bg-input-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-1 text-sm font-medium text-foreground">No leave requests yet</h3>
          <p className="text-sm text-muted-foreground">
            Submit your first leave request to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">Dates</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground lg:table-cell">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer border-b last:border-0 hover:bg-accent/50 transition-colors"
                  onClick={() => onSelectRequest(r.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`View ${r.leaveType} request`}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSelectRequest(r.id); }}
                >
                  <td className="px-4 py-3">
                    <LeaveTypeBadge type={r.leaveType} />
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-foreground sm:table-cell">
                    {r.startDate} - {r.endDate}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-foreground md:table-cell">
                    {r.days} day{r.days > 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
                    {new Date(r.submittedDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
