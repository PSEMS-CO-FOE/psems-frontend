import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface SupervisorInvite {
  cpiId: string;
  invitedAt: string;
  courseInstance: {
    id: string;
    name: string;
    department: string;
    academicYear: string;
  };
}

const invitesKey = ['supervisor-invites', 'mine'] as const;

// The logged-in lecturer's pending supervisor invitations across all CPIs.
export function useMySupervisorInvites() {
  return useQuery({
    queryKey: invitesKey,
    queryFn: async () => {
      const res = await api.get<SupervisorInvite[]>('/courses/supervisor-invites/mine');
      return res.data;
    },
  });
}

export function useRespondSupervisorInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { cpiId: string; decision: 'ACCEPT' | 'DECLINE' }) => {
      const res = await api.post(`/courses/${args.cpiId}/supervisors/respond`, {
        decision: args.decision,
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: invitesKey }),
  });
}
