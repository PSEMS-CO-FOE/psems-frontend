import { AppShell } from '@/components/layout/AppShell';
import { roleHome, roleLabel, roleNav } from '@/components/layout/roleNav';

export function LecturerLayout() {
  return (
    <AppShell
      roleLabel={roleLabel.LECTURER}
      homeTo={roleHome.LECTURER}
      nav={roleNav.LECTURER}
    />
  );
}
