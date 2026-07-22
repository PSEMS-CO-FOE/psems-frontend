import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  courseInstanceId: string | null;
  readAt: string | null;
  createdAt: string;
}

const notificationsKey = ['notifications'] as const;

export function useNotifications() {
  return useQuery({
    queryKey: notificationsKey,
    queryFn: async () => {
      const res = await api.get<Notification[]>('/notifications');
      return res.data;
    },
    // Light polling so the bell stays roughly current across roles.
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}
