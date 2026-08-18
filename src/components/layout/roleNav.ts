import type { ShellNavItem } from './AppShell';
import type { Role } from '@/types/auth';

/**
 * One definition of each role's rail. Profile and the directory are reachable
 * from every role, so they need the same nav as the section the reader came
 * from — duplicating these arrays in each layout is how they drift apart.
 */
export const roleNav: Record<Role, ShellNavItem[]> = {
  STUDENT: [
    { to: '/student', label: 'My courses', icon: 'courses', end: true },
    { to: '/directory', label: 'Find a supervisor', icon: 'people' },
  ],
  LECTURER: [
    { to: '/lecturer', label: 'My courses', icon: 'courses', end: true },
    { to: '/lecturer/discover', label: 'Find courses', icon: 'discover' },
    { to: '/directory', label: 'Directory', icon: 'people' },
  ],
  COURSE_COORDINATOR: [
    { to: '/coordinator', label: 'My courses', icon: 'courses', end: true },
    { to: '/directory', label: 'Directory', icon: 'people' },
  ],
  SYSTEM_ADMIN: [
    { to: '/admin/lecturers', label: 'Lecturer approvals', icon: 'people' },
    { to: '/admin/students', label: 'Student provisioning', icon: 'upload' },
    { to: '/admin/coordinators', label: 'Coordinators', icon: 'shield' },
    { to: '/directory', label: 'Directory', icon: 'discover' },
  ],
};

export const roleLabel: Record<Role, string> = {
  STUDENT: 'Student',
  LECTURER: 'Lecturer',
  COURSE_COORDINATOR: 'Coordinator',
  SYSTEM_ADMIN: 'System admin',
};

export const roleHome: Record<Role, string> = {
  STUDENT: '/student',
  LECTURER: '/lecturer',
  COURSE_COORDINATOR: '/coordinator',
  SYSTEM_ADMIN: '/admin',
};
