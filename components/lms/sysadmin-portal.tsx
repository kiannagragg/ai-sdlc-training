'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { UserRole, UserProfile } from '@/components/lms/types';
import {
  CURRENT_USER_SYSADMIN,
  CURRENT_USER_EMPLOYEE,
  CURRENT_USER_MANAGER,
  CURRENT_USER_HR,
} from '@/components/lms/mock-data';

const ALL_USERS: UserProfile[] = [
  CURRENT_USER_EMPLOYEE,
  CURRENT_USER_MANAGER,
  CURRENT_USER_HR,
  CURRENT_USER_SYSADMIN,
];
import {
  Info,
  Users,
  Activity,
  Building2,
  MapPin,
  Search,
  Shield,
  ShieldCheck,
  ShieldHalf,
  ShieldX,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';

const roleIcons: Record<UserRole, React.ElementType> = {
  employee: ShieldX,
  manager: ShieldHalf,
  hr_admin: ShieldCheck,
  sys_admin: Shield,
};

const roleLabels: Record<UserRole, string> = {
  employee: 'Employee',
  manager: 'Manager',
  hr_admin: 'HR Admin',
  sys_admin: 'Sys Admin',
};

const DEPARTMENTS = [...new Set(ALL_USERS.map((e) => e.department))];

export function SysAdminPortal() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('employee');

  const filtered = useMemo(() => {
    let result = [...ALL_USERS];
    if (roleFilter !== 'all') result = result.filter((e) => e.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q),
      );
    }
    return result;
  }, [search, roleFilter]);

  function handleRoleChange(employeeId: string, role: UserRole) {
    setEditingUser(null);
  }

  const activeToday = useMemo(() => Math.floor(ALL_USERS.length * 0.75), []);

  return (
    <div className="p-4 lg:p-6">
      <div
        role="alert"
        className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
      >
        <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">System Administration Scope</p>
          <p className="text-xs text-blue-700">
            You have full access to manage users, roles, and system-wide settings across all
            departments, offices, and branches of the corporation.
          </p>
        </div>
      </div>

      <h1 className="mb-6 text-2xl font-semibold text-foreground">System Administration</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Users', value: ALL_USERS.length.toString(), icon: Users, desc: 'All departments' },
          { label: 'Active Today', value: activeToday.toString(), icon: Activity, desc: 'Currently online' },
          { label: 'Departments', value: DEPARTMENTS.length.toString(), icon: Building2, desc: 'Across all offices' },
          { label: 'Offices', value: '3', icon: MapPin, desc: 'Makati, Cebu, Davao' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-lg border bg-input-background px-4 pl-9 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-secondary/50 p-0.5">
          {(['all', 'employee', 'manager', 'hr_admin', 'sys_admin'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                roleFilter === role
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {role === 'all' ? 'All' : roleLabels[role]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
              <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground sm:table-cell">Role</th>
              <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">Department</th>
              <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground lg:table-cell">Office</th>
              <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground lg:table-cell">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => {
              const RoleIcon = roleIcons[emp.role];
              return (
                <tr key={emp.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary shrink-0">
                        {emp.fullName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{emp.fullName}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <RoleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-foreground">{roleLabels[emp.role]}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-foreground md:table-cell">
                    {emp.department}
                  </td>
                  <td className="hidden px-4 py-3 text-sm text-foreground lg:table-cell">
                    {emp.office}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => { setEditingUser(emp.id); setNewRole(emp.role); }}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                    >
                      Edit Role
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setEditingUser(null)} />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Edit user role"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Change User Role</h2>
                <p className="text-sm text-muted-foreground">
                  {ALL_USERS.find((e) => e.id === editingUser)?.fullName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              {(['employee', 'manager', 'hr_admin', 'sys_admin'] as UserRole[]).map((role) => {
                const Icon = roleIcons[role];
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setNewRole(role)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
                      newRole === role
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent',
                    )}
                  >
                    <Icon className={cn('h-4 w-4', newRole === role ? 'text-primary' : 'text-muted-foreground')} />
                    <div className="flex-1">
                      <p className={cn('text-sm font-medium', newRole === role ? 'text-primary' : 'text-foreground')}>
                        {roleLabels[role]}
                      </p>
                    </div>
                    {newRole === role && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange(editingUser, newRole)}
                className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Confirm Change
              </button>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
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
