import { AppShell } from '@/components/lms/app-shell';
import { EmployeePortal } from '@/components/lms/employee-portal';

export default function EmployeePage() {
  return (
    <AppShell role="employee">
      <EmployeePortal />
    </AppShell>
  );
}
