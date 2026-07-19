import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

interface ChangePasswordArgs {
  currentPassword: string;
  newPassword: string;
}

export function useChangePassword() {
  const navigate = useNavigate();
  const clearForcePasswordChange = useAuthStore((s) => s.clearForcePasswordChange);

  return useMutation({
    mutationFn: async (args: ChangePasswordArgs) => {
      const res = await api.post('/auth/change-password', args);
      return res.data as { message: string };
    },
    onSuccess: () => {
      // Current access token stays valid; just drop the flag and route home.
      clearForcePasswordChange();
      navigate('/', { replace: true });
    },
  });
}
