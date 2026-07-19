import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { Role } from '@/types/auth';

const HOME_BY_ROLE: Record<Role, string> = {
  SYSTEM_ADMIN: '/admin',
  COURSE_COORDINATOR: '/coordinator',
  LECTURER: '/lecturer',
  STUDENT: '/student',
};

export function HomeRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={HOME_BY_ROLE[user.role] ?? '/login'} replace />;
}
