import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

// `id` is the lecturer-row id (what approve/reject take), not the user id.
export interface PendingLecturer {
  id: string;
  user: {
    id: string;
    email: string;
    fullName: string | null;
    createdAt: string;
  };
}

const pendingLecturersKey = ['lecturers', 'pending'] as const;

export function usePendingLecturers() {
  return useQuery({
    queryKey: pendingLecturersKey,
    queryFn: async () => {
      const res = await api.get<PendingLecturer[]>('/lecturers/pending');
      return res.data;
    },
  });
}

export function useLecturerDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { lecturerId: string; decision: 'approve' | 'reject' }) => {
      const res = await api.post(`/lecturers/${args.lecturerId}/${args.decision}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pendingLecturersKey });
    },
  });
}
