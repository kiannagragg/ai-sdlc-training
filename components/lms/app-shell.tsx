'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { UserRole, UserProfile, SidebarNavItem } from '@/components/lms/types';
import {
  CURRENT_USER_EMPLOYEE,
  CURRENT_USER_MANAGER,
  CURRENT_USER_HR,
  CURRENT_USER_SYSADMIN,
  MOCK_NOTIFICATIONS,
} from '@/components/lms/mock-data';
import {
  Menu,
  X,
  LayoutDashboard,
  FileText,
  CheckSquare,
  Calendar,
  ListChecks,
  PiggyBank,
  Tags,
  ScrollText,
  BarChart3,
  Users,
  Bell,
  ChevronDown,
  LogOut,
  Shield,
  Building2,
} from 'lucide-react';

const roleNavMap: Record<UserRole, SidebarNavItem[]> = {
  employee: [
    { icon: 'LayoutDashboard', label: 'Dashboard', href: '/employee' },
    { icon: 'FileText', label: 'My Requests', href: '/employee/requests' },
  ],
  manager: [
    { icon: 'CheckSquare', label: 'Approvals', href: '/manager', badge: 3 },
    { icon: 'Calendar', label: 'Calendar', href: '/manager/calendar' },
  ],
  hr_admin: [
    { icon: 'ListChecks', label: 'All Requests', href: '/admin' },
    { icon: 'PiggyBank', label: 'Entitlements', href: '/admin/entitlements' },
    { icon: 'Tags', label: 'Leave Types', href: '/admin/leave-types' },
    { icon: 'ScrollText', label: 'Audit Log', href: '/admin/audit-log' },
    { icon: 'BarChart3', label: 'Reports', href: '/admin/reports' },
  ],
  sys_admin: [
    { icon: 'Users', label: 'Users', href: '/sysadmin' },
  ],
};

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Calendar,
  ListChecks,
  PiggyBank,
  Tags,
  ScrollText,
  BarChart3,
  Users,
};

const roleLabels: Record<UserRole, string> = {
  employee: 'Employee',
  manager: 'Manager',
  hr_admin: 'HR Admin',
  sys_admin: 'Sys Admin',
};

const roleIcons: Record<UserRole, React.ElementType> = {
  employee: FileText,
  manager: CheckSquare,
  hr_admin: Shield,
  sys_admin: Building2,
};

interface AppShellProps {
  children: React.ReactNode;
  role: UserRole;
}

export function AppShell({ children, role }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const roleUserMap: Record<UserRole, UserProfile> = {
    employee: CURRENT_USER_EMPLOYEE,
    manager: CURRENT_USER_MANAGER,
    hr_admin: CURRENT_USER_HR,
    sys_admin: CURRENT_USER_SYSADMIN,
  };

  const user = roleUserMap[role];
  const navItems = roleNavMap[role];
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
  const RoleIcon = roleIcons[role];

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        aria-label="Sidebar navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        role="navigation"
      >
        <div className="flex h-16 items-center gap-3 border-b px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">M</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">Meridian LMS</span>
            <span className="text-[10px] text-muted-foreground">{roleLabels[role]}</span>
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3" aria-label="Main navigation">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring/20',
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {user.fullName.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user.fullName}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className={cn(
                'relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent',
                'focus:outline-none focus:ring-2 focus:ring-ring/20',
              )}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              aria-expanded={notifOpen}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border bg-card shadow-lg">
                  <div className="border-b px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">Notifications</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {MOCK_NOTIFICATIONS.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      MOCK_NOTIFICATIONS.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setNotifOpen(false)}
                          className={cn(
                            'flex w-full gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent',
                            !n.read && 'bg-accent/50',
                          )}
                        >
                          <div className="flex-1">
                            <p className={cn('text-sm', n.read ? 'text-foreground' : 'font-medium text-foreground')}>
                              {n.title}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={cn(
                'flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-accent',
                'focus:outline-none focus:ring-2 focus:ring-ring/20',
              )}
              aria-label="User menu"
              aria-expanded={userMenuOpen}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {user.fullName.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-foreground">{user.fullName}</p>
                <p className="text-[10px] text-muted-foreground">{roleLabels[role]}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border bg-card shadow-lg">
                  <div className="border-b px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 border-b px-4 py-2.5">
                    <RoleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{roleLabels[role]}</span>
                  </div>
                  <div className="p-1">
                    <button
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors',
                        'hover:bg-accent hover:text-foreground',
                      )}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
