import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { Role } from '@/types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  // Omit to allow any authenticated user.
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { accessToken, user, forcePasswordChange } = useAuthStore();

  // Remember the target so login can send the user back to it.
  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (forcePasswordChange && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
