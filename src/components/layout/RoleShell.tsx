import { AppShell } from './AppShell';
import { roleHome, roleLabel, roleNav } from './roleNav';
import { useAuthStore } from '@/stores/authStore';

/**
 * The shell for routes that belong to no single role — the directory and
 * profiles, which a student, lecturer, coordinator and admin all reach. The rail
 * comes from whoever is signed in, so the reader keeps the navigation of the
 * section they came from instead of landing on a bare page with no way back.
 */
export function RoleShell() {
  const role = useAuthStore((s) => s.user?.role);
  if (!role) return null;

  return <AppShell roleLabel={roleLabel[role]} homeTo={roleHome[role]} nav={roleNav[role]} />;
}
