import { AppShell } from '@/components/layout/AppShell';
import { roleHome, roleLabel, roleNav } from '@/components/layout/roleNav';

export function AdminLayout() {
  return (
    <AppShell
      roleLabel={roleLabel.SYSTEM_ADMIN}
      homeTo={roleHome.SYSTEM_ADMIN}
      nav={roleNav.SYSTEM_ADMIN}
    />
  );
}
