export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type LeaveTypeName = 'Annual Leave' | 'Sick Leave' | 'Emergency Leave' | 'Unpaid Leave' | 'Paternity/Maternity Leave';
export type UserRole = 'employee' | 'manager' | 'hr_admin' | 'sys_admin';
export type AuditAction = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'OVERRIDDEN';
export type PortalView = 'dashboard' | 'my-requests' | 'submit-request' | 'approvals' | 'calendar' | 'requests' | 'entitlements' | 'leave-types' | 'audit-log' | 'reports';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  managerId?: string;
  managerName?: string;
  department: string;
  office: 'Makati HQ' | 'Cebu' | 'Davao';
  initials: string;
}

export interface LeaveBalance {
  leaveType: LeaveTypeName;
  total: number;
  used: number;
  remaining: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  office: 'Makati HQ' | 'Cebu' | 'Davao';
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  submittedDate: string;
  managerId: string;
  managerName: string;
  managerNote?: string;
  rejectionReason?: string;
  hasDocument: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorId: string;
  action: AuditAction;
  recordId: string;
  tableName: string;
  oldData: Record<string, unknown>;
  newData: Record<string, unknown>;
}

export interface LeaveTypeConfig {
  id: string;
  name: LeaveTypeName;
  defaultDays: number;
  allowCarryover: boolean;
  isActive: boolean;
}

export interface ApprovalCardData {
  id: string;
  employee: UserProfile;
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  createdAt: string;
}

export interface SidebarNavItem {
  icon: string;
  label: string;
  href: string;
  badge?: number;
}

export interface StatCard {
  label: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

export interface QuickLink {
  icon: string;
  label: string;
  description: string;
  action: string;
}
