import { AppShell } from '@/components/lms/app-shell';
import { ManagerPortal } from '@/components/lms/manager-portal';

export default function ManagerPage() {
  return (
    <AppShell role="manager">
      <ManagerPortal />
    </AppShell>
  );
}
