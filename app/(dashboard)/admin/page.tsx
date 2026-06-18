import { AppShell } from '@/components/lms/app-shell';
import { HRAdminPortal } from '@/components/lms/hr-admin-portal';

export default function AdminPage() {
  return (
    <AppShell role="hr_admin">
      <HRAdminPortal />
    </AppShell>
  );
}
