import { AppShell } from '@/components/layout/AppShell';
import { roleHome, roleLabel, roleNav } from '@/components/layout/roleNav';

export function StudentLayout() {
  return (
    <AppShell
      roleLabel={roleLabel.STUDENT}
      homeTo={roleHome.STUDENT}
      nav={roleNav.STUDENT}
    />
  );
}
