import { useEffect } from 'react';
import { AppShell } from './AppShell';
import { roleLabel, workspacesFor, type WorkspaceId } from './workspaces';
import { useAuthStore } from '@/stores/authStore';

const LAST_WORKSPACE_KEY = 'psems-workspace';

/**
 * The shell every section renders. It supplies the rail for the workspace the
 * route belongs to, and for routes that belong to no single one — the directory
 * and profiles — the workspace the reader was last in, so they keep the
 * navigation of the section they came from instead of landing with no way back.
 */
export function RoleShell({ workspace }: { workspace?: WorkspaceId }) {
  const role = useAuthStore((s) => s.user?.role);
  const workspaces = role ? workspacesFor(role) : [];

  const remembered = workspace ?? localStorage.getItem(LAST_WORKSPACE_KEY);
  const current = workspaces.find((w) => w.id === remembered) ?? workspaces[0];

  useEffect(() => {
    if (current) localStorage.setItem(LAST_WORKSPACE_KEY, current.id);
  }, [current]);

  if (!role || !current) return null;

  return <AppShell roleLabel={roleLabel[role]} workspaces={workspaces} currentId={current.id} />;
}
