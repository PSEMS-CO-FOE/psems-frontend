import type { IconName } from '@/components/ui';
import type { Role } from '@/types/auth';

export interface ShellNavItem {
  to: string;
  label: string;
  icon: IconName;
  /** Only match the exact path — for the section's own index route. */
  end?: boolean;
}

export type WorkspaceId =
  | 'coordinating'
  | 'supervising'
  | 'studying'
  | 'administration'
  | 'platform';

/**
 * One hat a reader can wear. A lecturer promoted to coordinator keeps both, so
 * the shell has to let them move between the two rather than pick one at login.
 */
export interface Workspace {
  id: WorkspaceId;
  label: string;
  /** One line on what belongs to this hat, shown while switching. */
  blurb: string;
  icon: IconName;
  home: string;
  nav: ShellNavItem[];
}

const DIRECTORY: ShellNavItem = { to: '/directory', label: 'Directory', icon: 'people' };

const coordinating: Workspace = {
  id: 'coordinating',
  label: 'Coordinating',
  blurb: 'Phases, rubrics, scheduling and marks for the courses you run',
  icon: 'shield',
  home: '/coordinator',
  nav: [{ to: '/coordinator', label: 'My courses', icon: 'courses', end: true }, DIRECTORY],
};

const supervising: Workspace = {
  id: 'supervising',
  label: 'Supervising',
  blurb: 'Your ideas, the groups you take on, and panels you sit on',
  icon: 'people',
  home: '/lecturer',
  nav: [
    { to: '/lecturer', label: 'My courses', icon: 'courses', end: true },
    { to: '/lecturer/discover', label: 'Find courses', icon: 'discover' },
    DIRECTORY,
  ],
};

const studying: Workspace = {
  id: 'studying',
  label: 'Studying',
  blurb: 'Your courses, group and submissions',
  icon: 'courses',
  home: '/student',
  nav: [
    { to: '/student', label: 'My courses', icon: 'courses', end: true },
    { to: '/directory', label: 'Find a supervisor', icon: 'people' },
  ],
};

const administration: Workspace = {
  id: 'administration',
  label: 'Administration',
  blurb: 'Approvals, provisioning and roles',
  icon: 'shield',
  home: '/admin',
  nav: [
    { to: '/admin/lecturers', label: 'Lecturer approvals', icon: 'people' },
    { to: '/admin/students', label: 'Student provisioning', icon: 'upload' },
    { to: '/admin/coordinators', label: 'Coordinators', icon: 'shield' },
    { to: '/directory', label: 'Directory', icon: 'discover' },
  ],
};

const platform: Workspace = {
  id: 'platform',
  label: 'Platform',
  blurb: 'Administrators, accounts and the audit log',
  icon: 'shield',
  home: '/super-admin',
  nav: [
    { to: '/super-admin', label: 'Administrators', icon: 'shield', end: true },
    { to: '/super-admin/accounts', label: 'Accounts', icon: 'people' },
    { to: '/super-admin/reset-requests', label: 'Password requests', icon: 'discover' },
    { to: '/super-admin/audit', label: 'Audit log', icon: 'courses' },
  ],
};

/**
 * Promotion does not end a supervision, so a coordinator holds two workspaces.
 * Every other role holds one and never sees the switcher.
 */
export function workspacesFor(role: Role): Workspace[] {
  switch (role) {
    case 'COURSE_COORDINATOR':
      return [coordinating, supervising];
    case 'LECTURER':
      return [supervising];
    case 'STUDENT':
      return [studying];
    case 'SYSTEM_ADMIN':
      return [administration];
    case 'SUPER_ADMIN':
      return [platform];
  }
}

export const roleLabel: Record<Role, string> = {
  SUPER_ADMIN: 'Super admin',
  STUDENT: 'Student',
  LECTURER: 'Lecturer',
  COURSE_COORDINATOR: 'Coordinator',
  SYSTEM_ADMIN: 'System admin',
};
