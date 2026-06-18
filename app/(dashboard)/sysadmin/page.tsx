import { AppShell } from '@/components/lms/app-shell';
import { SysAdminPortal } from '@/components/lms/sysadmin-portal';

export default function SysAdminPage() {
  return (
    <AppShell role="sys_admin">
      <SysAdminPortal />
    </AppShell>
  );
}
