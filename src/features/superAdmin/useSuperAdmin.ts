import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type { Role } from '@/types/auth';

export interface ManagedUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  forcePasswordChange: boolean;
  suspendedAt: string | null;
  suspendedReason: string | null;
  createdAt: string;
}

export interface PasswordResetRequest {
  id: string;
  email: string;
  note: string | null;
  status: 'PENDING' | 'COMPLETED' | 'DISMISSED';
  createdAt: string;
  handledAt: string | null;
  // Null when the address matches no account — worth showing rather than hiding.
  user: Pick<ManagedUser, 'id' | 'email' | 'fullName' | 'role' | 'suspendedAt'> | null;
}

export interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  statusCode: number;
  createdAt: string;
  actor: { id: string; email: string; fullName: string; role: Role } | null;
}

const keys = {
  admins: ['super-admin', 'admins'] as const,
  users: (query: string) => ['super-admin', 'users', query] as const,
  resetRequests: ['super-admin', 'reset-requests'] as const,
  audit: ['super-admin', 'audit'] as const,
};

export function useSystemAdmins() {
  return useQuery({
    queryKey: keys.admins,
    queryFn: async () => {
      const res = await api.get<{ admins: ManagedUser[] }>('/super-admin/admins');
      return res.data.admins;
    },
  });
}

// The temp password comes back once and is never retrievable again, so the
// caller must show it rather than refetch it.
export function useCreateSystemAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { email: string; fullName: string }) => {
      const res = await api.post('/super-admin/admins', args);
      return res.data as { user: ManagedUser; tempPassword: string };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.admins }),
  });
}

export function useManagedUsers(query: string) {
  return useQuery({
    queryKey: keys.users(query),
    queryFn: async () => {
      const res = await api.get<{ users: ManagedUser[] }>('/super-admin/users', {
        params: query ? { query } : undefined,
      });
      return res.data.users;
    },
  });
}

function useAccountMutation<TArgs>(run: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    // Every account action can change what any of these lists show, and they are
    // small enough that refetching all of them is cheaper than reasoning about
    // which one moved.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin'] });
    },
  });
}

export function useSuspendUser() {
  return useAccountMutation(async ({ userId, reason }: { userId: string; reason: string }) => {
    await api.post(`/super-admin/users/${userId}/suspend`, { reason });
  });
}

export function useReinstateUser() {
  return useAccountMutation(async (userId: string) => {
    await api.post(`/super-admin/users/${userId}/reinstate`);
  });
}

export function useResetUserPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post(`/super-admin/users/${userId}/reset-password`);
      return res.data as { user: ManagedUser; tempPassword: string };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['super-admin'] }),
  });
}

export function useDeleteUser() {
  return useAccountMutation(async (userId: string) => {
    await api.delete(`/super-admin/users/${userId}`);
  });
}

export function usePasswordResetRequests(status: 'PENDING' | 'COMPLETED' | 'DISMISSED' = 'PENDING') {
  return useQuery({
    queryKey: [...keys.resetRequests, status],
    queryFn: async () => {
      const res = await api.get<{ requests: PasswordResetRequest[] }>(
        '/super-admin/password-reset-requests',
        { params: { status } },
      );
      return res.data.requests;
    },
  });
}

export function useDismissResetRequest() {
  return useAccountMutation(async (requestId: string) => {
    await api.post(`/super-admin/password-reset-requests/${requestId}/dismiss`);
  });
}

export function useAuditLog(limit = 100) {
  return useQuery({
    queryKey: [...keys.audit, limit],
    queryFn: async () => {
      const res = await api.get<{ entries: AuditEntry[] }>('/super-admin/audit', {
        params: { limit },
      });
      return res.data.entries;
    },
  });
}
