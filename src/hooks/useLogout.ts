import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reset = useAuthStore((s) => s.reset);

  return async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Clear the client regardless of server outcome.
    } finally {
      reset();
      queryClient.clear(); // drop all cached server data for the previous user
      // `state: null` clears the remembered page, so the next person to sign in
      // on this tab does not land on the previous account's screen.
      navigate('/login', { replace: true, state: null });
    }
  };
}
