import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import type { LoginResponse } from '@/types/auth';

interface LoginArgs {
  email: string;
  password: string;
}

interface LocationState {
  from?: { pathname: string };
}

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (args: LoginArgs) => {
      const res = await api.post<LoginResponse>('/auth/login', args);
      return res.data;
    },
    onSuccess: (data) => {
      setSession({
        accessToken: data.accessToken,
        user: data.user,
        forcePasswordChange: data.forcePasswordChange,
      });

      if (data.forcePasswordChange) {
        navigate('/change-password', { replace: true });
        return;
      }

      const from = (location.state as LocationState | null)?.from?.pathname;
      navigate(from ?? '/', { replace: true });
    },
  });
}
