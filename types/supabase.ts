export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'employee' | 'manager' | 'hr_admin' | 'sys_admin';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type Office = 'Makati HQ' | 'Cebu' | 'Davao';
export type AuditAction = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'OVERRIDDEN';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          manager_id: string | null;
          department: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          manager_id?: string | null;
          department?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          role?: UserRole;
          manager_id?: string | null;
          department?: string;
          deleted_at?: string | null;
        };
      };
      leaves: {
        Row: {
          id: string;
          employee_id: string;
          leave_type: string;
          start_date: string;
          end_date: string;
          reason: string;
          supporting_doc_url: string | null;
          status: LeaveStatus;
          manager_note: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          employee_id: string;
          leave_type: string;
          start_date: string;
          end_date: string;
          reason: string;
          supporting_doc_url?: string | null;
          status?: LeaveStatus;
          manager_note?: string | null;
        };
        Update: {
          status?: LeaveStatus;
          manager_note?: string | null;
          supporting_doc_url?: string | null;
          deleted_at?: string | null;
        };
      };
      leave_balances: {
        Row: {
          id: string;
          employee_id: string;
          leave_type: string;
          year: number;
          total_days: number;
          used_days: number;
        };
        Insert: {
          employee_id: string;
          leave_type: string;
          year: number;
          total_days: number;
          used_days?: number;
        };
        Update: {
          total_days?: number;
          used_days?: number;
        };
      };
      leave_types: {
        Row: {
          id: string;
          name: string;
          default_days: number;
          allow_carryover: boolean;
          is_active: boolean;
          deleted_at: string | null;
        };
        Insert: {
          name: string;
          default_days: number;
          allow_carryover?: boolean;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          default_days?: number;
          allow_carryover?: boolean;
          is_active?: boolean;
          deleted_at?: string | null;
        };
      };
      audit_log: {
        Row: {
          id: string;
          table_name: string;
          record_id: string;
          action: string;
          actor_id: string | null;
          old_data: Json;
          new_data: Json;
          created_at: string;
        };
        Insert: {
          table_name: string;
          record_id: string;
          action: string;
          actor_id?: string | null;
          old_data?: Json;
          new_data: Json;
        };
        Update: never;
      };
    };
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Leave = Database['public']['Tables']['leaves']['Row'];
export type LeaveInsert = Database['public']['Tables']['leaves']['Insert'];
export type LeaveUpdate = Database['public']['Tables']['leaves']['Update'];

export type LeaveBalance = Database['public']['Tables']['leave_balances']['Row'];
export type LeaveBalanceInsert = Database['public']['Tables']['leave_balances']['Insert'];
export type LeaveBalanceUpdate = Database['public']['Tables']['leave_balances']['Update'];

export type LeaveType = Database['public']['Tables']['leave_types']['Row'];
export type LeaveTypeInsert = Database['public']['Tables']['leave_types']['Insert'];
export type LeaveTypeUpdate = Database['public']['Tables']['leave_types']['Update'];

export type AuditLogEntry = Database['public']['Tables']['audit_log']['Row'];
export type AuditLogInsert = Database['public']['Tables']['audit_log']['Insert'];
