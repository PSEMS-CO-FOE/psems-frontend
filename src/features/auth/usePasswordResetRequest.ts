import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

interface PasswordResetRequestArgs {
  email: string;
  note?: string;
}

// The reply is deliberately the same whether or not the address has an account,
// so there is nothing here to branch on: a success means the request was taken,
// not that the account exists.
export function usePasswordResetRequest() {
  return useMutation({
    mutationFn: async (args: PasswordResetRequestArgs) => {
      const res = await api.post('/auth/password-reset-request', args);
      return res.data as { message: string };
    },
  });
}
