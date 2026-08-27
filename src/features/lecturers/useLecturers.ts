import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type { Role } from '@/types/auth';

// An approved lecturer, as returned by GET /lecturers/approved — keyed by
// userId (what the assignment endpoints take).
export interface ApprovedLecturer {
  userId: string;
  email: string;
  fullName: string | null;
  // COURSE_COORDINATOR once promoted, so a screen can say so.
  role: Role;
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

// Approved lecturer pool — for coordinator assignment pickers and the admin's
// promote-to-coordinator screen.
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

// System Admin promotes an approved lecturer to Course Coordinator.
export function useAssignCoordinator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post(`/users/${userId}/assign-coordinator`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lecturers', 'approved'] }),
  });
}

// Undoes an accidental promotion.
export function useRevokeCoordinator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post(`/users/${userId}/revoke-coordinator`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lecturers', 'approved'] }),
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

export interface BulkProvisionResult {
  batchId: string;
  created: number;
  skipped: { row: number; email: string; reason: string }[];
  invalid: { row: number; issues: string[] }[];
}

// CSV header: email,fullName,department,designation. These accounts are
// auto-approved and carry a forced first-login password change.
export function useBulkProvisionLecturers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post<BulkProvisionResult>('/lecturers/bulk-provision', form);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lecturers'] }),
  });
}
