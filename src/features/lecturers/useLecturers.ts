import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

// An approved lecturer, as returned by GET /lecturers/approved — keyed by
// userId (what the assignment endpoints take).
export interface ApprovedLecturer {
  userId: string;
  email: string;
  fullName: string | null;
}

// Public self-registration — no auth. Account lands PENDING until approved.
export function useRegisterLecturer() {
  return useMutation({
    mutationFn: async (args: { email: string; fullName: string; password: string }) => {
      const res = await api.post('/lecturers/register', args);
      return res.data as { message: string };
    },
  });
}

// Approved lecturer pool, for coordinator assignment pickers.
export function useApprovedLecturers(enabled = true) {
  return useQuery({
    queryKey: ['lecturers', 'approved'],
    enabled,
    queryFn: async () => {
      const res = await api.get<ApprovedLecturer[]>('/lecturers/approved');
      return res.data;
    },
  });
}

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
