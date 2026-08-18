import { AppShell } from '@/components/layout/AppShell';
import { roleHome, roleLabel, roleNav } from '@/components/layout/roleNav';

export function CoordinatorLayout() {
  return (
    <AppShell
      roleLabel={roleLabel.COURSE_COORDINATOR}
      homeTo={roleHome.COURSE_COORDINATOR}
      nav={roleNav.COURSE_COORDINATOR}
    />
  );
}
