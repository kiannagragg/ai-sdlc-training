export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'employee' | 'manager' | 'hr_admin' | 'sys_admin';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type AuditAction = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'OVERRIDDEN';
export type Office = 'Makati HQ' | 'Cebu' | 'Davao';

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: ProfileInsert; Update: ProfileUpdate };
      leaves: { Row: Leave; Insert: LeaveInsert; Update: LeaveUpdate };
      leave_types: { Row: LeaveType; Insert: LeaveTypeInsert; Update: LeaveTypeUpdate };
      leave_balances: { Row: LeaveBalance; Insert: LeaveBalanceInsert; Update: LeaveBalanceUpdate };
      audit_log: { Row: AuditLogEntry; Insert: AuditLogInsert; Update: never };
    };
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  manager_id: string | null;
  department: string;
  office: Office;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
export interface ProfileInsert {
  id: string;
  email: string;
  full_name: string;
  role?: UserRole;
  manager_id?: string | null;
  department?: string;
  office?: Office;
}
export interface ProfileUpdate {
  email?: string;
  full_name?: string;
  role?: UserRole;
  manager_id?: string | null;
  department?: string;
  office?: Office;
  deleted_at?: string | null;
}

export interface Leave {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  supporting_doc_url: string | null;
  status: LeaveStatus;
  manager_note: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
export interface LeaveInsert {
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  supporting_doc_url?: string | null;
  status?: LeaveStatus;
  manager_note?: string | null;
  rejection_reason?: string | null;
}
export interface LeaveUpdate {
  status?: LeaveStatus;
  manager_note?: string | null;
  rejection_reason?: string | null;
  supporting_doc_url?: string | null;
  deleted_at?: string | null;
}

export interface LeaveType {
  id: string;
  name: string;
  default_days: number;
  allow_carryover: boolean;
  is_active: boolean;
  deleted_at: string | null;
}
export interface LeaveTypeInsert {
  name: string;
  default_days: number;
  allow_carryover?: boolean;
  is_active?: boolean;
}
export interface LeaveTypeUpdate {
  name?: string;
  default_days?: number;
  allow_carryover?: boolean;
  is_active?: boolean;
  deleted_at?: string | null;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type: string;
  year: number;
  total_days: number;
  used_days: number;
  deleted_at: string | null;
}
export interface LeaveBalanceInsert {
  employee_id: string;
  leave_type: string;
  year: number;
  total_days: number;
  used_days?: number;
}
export interface LeaveBalanceUpdate {
  total_days?: number;
  used_days?: number;
  deleted_at?: string | null;
}

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: AuditAction;
  actor_id: string | null;
  old_data: Json;
  new_data: Json;
  created_at: string;
}
export interface AuditLogInsert {
  table_name: string;
  record_id: string;
  action: AuditAction;
  actor_id?: string | null;
  old_data?: Json;
  new_data: Json;
}
