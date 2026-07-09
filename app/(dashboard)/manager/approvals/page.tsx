import { AppShell } from '@/components/lms/app-shell';
import { ManagerPortal } from '@/components/lms/manager-portal';

export default function ManagerApprovalsPage() {
  return (
    <AppShell role="manager">
      <ManagerPortal />
    </AppShell>
  );
}
