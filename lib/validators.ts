import { z } from 'zod';

const uuidSchema = z.string().uuid();

const leaveTypeSchema = z.enum([
  'Annual Leave',
  'Sick Leave',
  'Emergency Leave',
  'Unpaid Leave',
  'Paternity/Maternity Leave',
]);

export const leaveRequestSchema = z.object({
  employee_id: uuidSchema,
  leave_type: leaveTypeSchema,
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date (YYYY-MM-DD)'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  supporting_doc_url: z.string().url().optional(),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: 'End date must be on or after start date', path: ['end_date'] },
);

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;

export const leaveActionSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
  manager_note: z.string().optional(),
  rejection_reason: z.string().optional(),
}).refine(
  (data) => {
    if (data.action === 'REJECTED' && !data.rejection_reason) {
      return false;
    }
    return true;
  },
  { message: 'Rejection reason is required when rejecting', path: ['rejection_reason'] },
);

export type LeaveActionInput = z.infer<typeof leaveActionSchema>;

export const profileUpdateSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255),
  department: z.string().min(1, 'Department is required').max(255),
  office: z.enum(['Makati HQ', 'Cebu', 'Davao']),
  role: z.enum(['employee', 'manager', 'hr_admin', 'sys_admin']).optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const balanceOverrideSchema = z.object({
  leave_type: leaveTypeSchema,
  year: z.number().int().min(2024).max(2099),
  total_days: z.number().int().min(0),
  used_days: z.number().int().min(0),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export type BalanceOverrideInput = z.infer<typeof balanceOverrideSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const auditLogFilterSchema = z.object({
  table_name: z.string().optional(),
  action: z.string().optional(),
  actor_id: uuidSchema.optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>;
