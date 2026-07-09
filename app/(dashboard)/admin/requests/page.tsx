import { AppShell } from '@/components/lms/app-shell';
import { HRAdminPortal } from '@/components/lms/hr-admin-portal';

export default function AdminRequestsPage() {
  return (
    <AppShell role="hr_admin">
      <HRAdminPortal />
    </AppShell>
  );
}
