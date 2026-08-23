import { AppShell } from '@/components/layout/AppShell';
import { roleHome, roleLabel, roleNav } from '@/components/layout/roleNav';

export function SuperAdminLayout() {
  return (
    <AppShell
      roleLabel={roleLabel.SUPER_ADMIN}
      homeTo={roleHome.SUPER_ADMIN}
      nav={roleNav.SUPER_ADMIN}
    />
  );
}
