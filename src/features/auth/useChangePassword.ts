import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

interface ChangePasswordArgs {
  // Omitted on the forced first-login change — the backend skips the check
  // there (the login seconds ago already proved the current password).
  currentPassword?: string;
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
