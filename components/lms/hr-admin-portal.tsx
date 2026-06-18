'use client';

import { useState, useMemo, Fragment } from 'react';
import { cn } from '@/lib/utils';
import type { PortalView, LeaveStatus, LeaveRequest, AuditEntry } from '@/components/lms/types';
import {
  ALL_REQUESTS,
  LEAVE_TYPES,
  AUDIT_LOG,
  ALL_EMPLOYEES_BALANCES,
  EMPLOYEE_BALANCES,
} from '@/components/lms/mock-data';
import { StatusBadge, LeaveTypeBadge, AuditActionBadge } from '@/components/lms/status-badge';
import {
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  BarChart3,
  Table2,
  Calendar,
  Users,
  Building2,
} from 'lucide-react';

const leaveKeyMap: Record<string, string> = {
  'Annual Leave': 'annualLeave',
  'Sick Leave': 'sickLeave',
  'Emergency Leave': 'emergencyLeave',
  'Unpaid Leave': 'unpaidLeave',
  'Paternity/Maternity Leave': 'maternityLeave',
};

interface HRAdminPortalProps {
  onViewChange?: (view: PortalView) => void;
}

type HRAdminView = 'requests' | 'entitlements' | 'leave-types' | 'audit-log' | 'reports';

export function HRAdminPortal({ onViewChange }: HRAdminPortalProps) {
  const [view, setView] = useState<HRAdminView>('requests');

  function handleViewChange(newView: HRAdminView) {
    setView(newView);
    onViewChange?.(newView as PortalView);
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-wrap gap-1 rounded-lg bg-secondary/50 p-1">
        {([
          { key: 'requests', label: 'All Requests' },
          { key: 'entitlements', label: 'Entitlements' },
          { key: 'leave-types', label: 'Leave Types' },
          { key: 'audit-log', label: 'Audit Log' },
          { key: 'reports', label: 'Reports' },
        ] as { key: HRAdminView; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleViewChange(tab.key)}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              view === tab.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'requests' && <RequestsView />}
      {view === 'entitlements' && <EntitlementsView />}
      {view === 'leave-types' && <LeaveTypesView />}
      {view === 'audit-log' && <AuditLogView />}
      {view === 'reports' && <ReportsView />}
    </div>
  );
}

function RequestsView() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('submittedDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [overrideModal, setOverrideModal] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<LeaveStatus>('APPROVED');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let result = [...ALL_REQUESTS];
    if (statusFilter !== 'all') result = result.filter((r) => r.status === statusFilter);
    if (typeFilter !== 'all') result = result.filter((r) => r.leaveType === typeFilter);
    if (deptFilter !== 'all') {
      const empIds = ALL_EMPLOYEES_BALANCES.filter((e) => e.department === deptFilter).map((e) => e.id);
      result = result.filter((r) => empIds.includes(r.employeeId));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.employeeName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.leaveType.toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      const aVal = a[sortColumn as keyof typeof a];
      const bVal = b[sortColumn as keyof typeof b];
      const cmp = (aVal ?? '') < (bVal ?? '') ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [statusFilter, typeFilter, deptFilter, search, sortColumn, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSort(col: string) {
    if (sortColumn === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDir('desc');
    }
  }

  const departments = useMemo(
    () => [...new Set(ALL_EMPLOYEES_BALANCES.map((e) => e.department))],
    [],
  );

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">All Leave Requests</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employee, ID, type..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="flex h-10 w-full rounded-lg border bg-input-background px-4 pl-9 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="flex h-10 rounded-lg border bg-input-background px-3 text-sm text-foreground"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
          className="flex h-10 rounded-lg border bg-input-background px-3 text-sm text-foreground"
          aria-label="Filter by leave type"
        >
          <option value="all">All Types</option>
          {LEAVE_TYPES.map((t) => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>
        <select
          value={deptFilter}
          onChange={(e) => { setDeptFilter(e.target.value); setPage(0); }}
          className="flex h-10 rounded-lg border bg-input-background px-3 text-sm text-foreground"
          aria-label="Filter by department"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {['employeeName', 'leaveType', 'startDate', 'days', 'status', 'submittedDate'].map((col) => (
                <th
                  key={col}
                  className={cn(
                    'cursor-pointer px-4 py-3 text-left text-xs font-medium text-muted-foreground hover:text-foreground',
                    col === 'days' && 'hidden md:table-cell',
                    col === 'submittedDate' && 'hidden lg:table-cell',
                  )}
                  onClick={() => toggleSort(col)}
                >
                  <div className="flex items-center gap-1">
                    {col === 'employeeName' ? 'Employee' :
                     col === 'leaveType' ? 'Type' :
                     col === 'startDate' ? 'Dates' :
                     col === 'days' ? 'Duration' :
                     col === 'status' ? 'Status' : 'Submitted'}
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-medium">
                      {r.employeeName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <span className="text-sm text-foreground">{r.employeeName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <LeaveTypeBadge type={r.leaveType} />
                </td>
                <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                  {r.startDate} - {r.endDate}
                </td>
                <td className="hidden px-4 py-3 text-sm text-foreground md:table-cell">
                  {r.days}d
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell whitespace-nowrap">
                  {new Date(r.submittedDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => { setOverrideModal(r.id); setNewStatus('APPROVED'); }}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                  >
                    Override
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} request{filtered.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(0)}
            disabled={page === 0}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-30"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {Math.max(1, totalPages)}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-30"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {overrideModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setOverrideModal(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-lg" role="dialog" aria-modal="true" aria-label="Override status">
            <h2 className="mb-1 text-lg font-semibold text-foreground">Override Status</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Change status for request <strong>{overrideModal}</strong>
            </p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as LeaveStatus)}
              className="mb-4 flex h-11 w-full rounded-lg border bg-input-background px-3 text-sm text-foreground"
            >
              <option value="APPROVED">Approve</option>
              <option value="REJECTED">Reject</option>
              <option value="CANCELLED">Cancel</option>
            </select>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setOverrideModal(null);
                }}
                className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
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

function EntitlementsView() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Leave Entitlements</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Employee</th>
              {LEAVE_TYPES.map((t) => (
                <th key={t.id} className="px-3 py-3 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {t.name.replace('Leave', '').trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_EMPLOYEES_BALANCES.map((emp) => (
              <tr key={emp.id} className="border-b last:border-0 hover:bg-accent/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-medium">
                      {emp.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{emp.name}</p>
                      <p className="text-[10px] text-muted-foreground">{emp.department}</p>
                    </div>
                  </div>
                </td>
                {LEAVE_TYPES.map((t) => {
                  const key = leaveKeyMap[t.name] as keyof typeof emp;
                  const bal = emp[key] as { total: number; used: number } | undefined;
                  const remaining = bal ? bal.total - bal.used : 0;
                  return (
                    <td key={t.id} className="px-3 py-3 text-right">
                      <input
                        type="number"
                        defaultValue={remaining}
                        className="h-8 w-14 rounded border bg-input-background px-2 text-right text-sm text-foreground text-center focus:border-ring focus:outline-none"
                        min={0}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeaveTypesView() {
  const [leaveTypes, setLeaveTypes] = useState(LEAVE_TYPES);

  function toggleActive(id: string) {
    setLeaveTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t)),
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Leave Types</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {leaveTypes.map((t) => (
          <div
            key={t.id}
            className={cn(
              'rounded-xl border bg-card p-5 shadow-sm transition-all',
              !t.isActive && 'opacity-60',
            )}
          >
            <div className="mb-3 flex items-start justify-between">
              <h3 className="font-semibold text-foreground">{t.name}</h3>
              <button
                type="button"
                onClick={() => toggleActive(t.id)}
                className={cn(
                  'rounded-lg p-1.5 transition-colors',
                  t.isActive
                    ? 'text-emerald-600 hover:bg-emerald-50'
                    : 'text-muted-foreground hover:bg-accent',
                )}
                aria-label={t.isActive ? 'Deactivate' : 'Activate'}
              >
                {t.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Default Days</span>
                <span className="font-medium text-foreground">{t.defaultDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Carryover</span>
                <span className="font-medium text-foreground">{t.allowCarryover ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span
                  className={cn(
                    'font-medium',
                    t.isActive ? 'text-emerald-600' : 'text-muted-foreground',
                  )}
                >
                  {t.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-lg border py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditLogView() {
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...AUDIT_LOG];
    if (tableFilter !== 'all') result = result.filter((l) => l.tableName === tableFilter);
    if (actionFilter !== 'all') result = result.filter((l) => l.action === actionFilter);
    if (actorFilter !== 'all') result = result.filter((l) => l.actorId === actorFilter);
    return result;
  }, [tableFilter, actionFilter, actorFilter]);

  const actorOptions = useMemo(() => {
    const unique = new Map<string, { id: string; name: string }>();
    AUDIT_LOG.forEach((l) => {
      if (!unique.has(l.actorId)) {
        unique.set(l.actorId, { id: l.actorId, name: l.actorName });
      }
    });
    return Array.from(unique.values());
  }, []);

  return (
    <div>
      <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800">Compliance Information</p>
          <p className="text-xs text-blue-700">
            All changes are tracked in an append-only audit log. RLS policies prevent any
            modifications or deletions of audit entries.
          </p>
        </div>
      </div>

      <h1 className="mb-6 text-2xl font-semibold text-foreground">Audit Log</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          className="flex h-10 rounded-lg border bg-input-background px-3 text-sm text-foreground"
          aria-label="Filter by table"
        >
          <option value="all">All Tables</option>
          <option value="leave_requests">Leave Requests</option>
          <option value="leave_balances">Leave Balances</option>
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="flex h-10 rounded-lg border bg-input-background px-3 text-sm text-foreground"
          aria-label="Filter by action"
        >
          <option value="all">All Actions</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="OVERRIDDEN">Overridden</option>
        </select>
        <select
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          className="flex h-10 rounded-lg border bg-input-background px-3 text-sm text-foreground"
          aria-label="Filter by actor"
        >
          <option value="all">All Actors</option>
          {actorOptions.map((actor) => (
            <option key={actor.id} value={actor.id}>{actor.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Table</th>
              <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">Actor</th>
              <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">Record</th>
              <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground lg:table-cell">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <Fragment key={log.id}>
                <tr
                  className="border-b hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                >
                  <td className="px-4 py-3">
                    <AuditActionBadge action={log.action} />
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-mono text-xs">
                    {log.tableName}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-foreground sm:table-cell">
                    {log.actorName}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-muted-foreground font-mono md:table-cell">
                    {log.recordId}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {expandedRow === log.id ? (
                      <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    )}
                  </td>
                </tr>
                {expandedRow === log.id && (
                  <tr>
                    <td colSpan={6} className="bg-muted/30 px-4 py-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-xs font-medium text-muted-foreground">Old Data</p>
                          <pre className="rounded-lg bg-muted p-3 text-xs text-foreground overflow-x-auto">
                            {JSON.stringify(log.oldData, null, 2) || '{}'}
                          </pre>
                        </div>
                        <div>
                          <p className="mb-1 text-xs font-medium text-muted-foreground">New Data</p>
                          <pre className="rounded-lg bg-muted p-3 text-xs text-foreground overflow-x-auto">
                            {JSON.stringify(log.newData, null, 2) || '{}'}
                          </pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsView() {
  const [reportType, setReportType] = useState<'utilization' | 'department'>('utilization');
  const [reportYear, setReportYear] = useState(2026);

  const totalAvailable = useMemo(() => {
    return ALL_EMPLOYEES_BALANCES.reduce((sum, emp) => {
      return sum + emp.annualLeave.total + emp.sickLeave.total + emp.emergencyLeave.total + emp.unpaidLeave.total + emp.maternityLeave.total;
    }, 0);
  }, []);

  const departmentSummary = useMemo(() => {
    const deptMap = new Map<string, { headcount: number; totalLeaves: number; totalDays: number }>();
    ALL_EMPLOYEES_BALANCES.forEach((e) => {
      const existing = deptMap.get(e.department) || { headcount: 0, totalLeaves: 0, totalDays: 0 };
      existing.headcount++;
      deptMap.set(e.department, existing);
    });
    ALL_REQUESTS.forEach((r) => {
      const emp = ALL_EMPLOYEES_BALANCES.find((e) => e.id === r.employeeId);
      if (emp) {
        const existing = deptMap.get(emp.department);
        if (existing) {
          existing.totalLeaves++;
          existing.totalDays += r.days;
        }
      }
    });
    return Array.from(deptMap.entries()).map(([dept, data]) => ({
      department: dept,
      ...data,
      avgDays: data.totalLeaves > 0 ? (data.totalDays / data.totalLeaves).toFixed(1) : '0',
    }));
  }, []);

  const usagePct = useMemo(() => {
    const totalUsed = ALL_REQUESTS
      .filter((r) => r.status === 'APPROVED' || r.status === 'PENDING')
      .reduce((sum, r) => sum + r.days, 0);
    return totalAvailable > 0 ? Math.round((totalUsed / totalAvailable) * 100) : 0;
  }, [totalAvailable]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Reports</h1>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border bg-card p-0.5">
          <button
            type="button"
            onClick={() => setReportType('utilization')}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              reportType === 'utilization' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
            )}
          >
            Utilization
          </button>
          <button
            type="button"
            onClick={() => setReportType('department')}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              reportType === 'department' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
            )}
          >
            Department Summary
          </button>
        </div>
        <select
          value={reportYear}
          onChange={(e) => setReportYear(Number(e.target.value))}
          className="flex h-10 rounded-lg border bg-input-background px-3 text-sm text-foreground"
        >
          {[2026, 2025, 2027].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {reportType === 'utilization' && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Overall Leave Utilization</h2>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">{usagePct}% utilized</span>
              <span className="text-xs text-muted-foreground">
                {ALL_REQUESTS.filter((r) => r.status === 'APPROVED').reduce((s, r) => s + r.days, 0)} of{' '}
                {totalAvailable} days
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  usagePct > 80 ? 'bg-destructive' : usagePct > 50 ? 'bg-amber-500' : 'bg-emerald-500',
                )}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">By Leave Type</h2>
            <div className="space-y-4">
              {LEAVE_TYPES.map((t) => {
                const used = ALL_REQUESTS
                  .filter((r) => r.leaveType === t.name && r.status === 'APPROVED')
                  .reduce((s, r) => s + r.days, 0);
                const key = leaveKeyMap[t.name] as keyof typeof ALL_EMPLOYEES_BALANCES[0];
                const typeTotal = ALL_EMPLOYEES_BALANCES.reduce((sum, emp) => {
                  const bal = emp[key] as { total: number; used: number } | undefined;
                  return sum + (bal?.total ?? 0);
                }, 0);
                const pct = typeTotal > 0 ? Math.round((used / typeTotal) * 100) : 0;
                return (
                  <div key={t.id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-foreground">{t.name}</span>
                      <span className="text-muted-foreground">{used} days ({Math.min(pct, 100)}%)</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          pct > 80 ? 'bg-destructive' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500',
                        )}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {reportType === 'department' && (
        <div className="rounded-xl border bg-card shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Department</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Headcount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Total Leaves</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Total Days</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Avg Days/Leave</th>
              </tr>
            </thead>
            <tbody>
              {departmentSummary.map((d) => (
                <tr key={d.department} className="border-b last:border-0 hover:bg-accent/50">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{d.department}</td>
                  <td className="px-4 py-3 text-right text-sm text-foreground">{d.headcount}</td>
                  <td className="px-4 py-3 text-right text-sm text-foreground">{d.totalLeaves}</td>
                  <td className="px-4 py-3 text-right text-sm text-foreground">{d.totalDays}</td>
                  <td className="px-4 py-3 text-right text-sm text-foreground">{d.avgDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
