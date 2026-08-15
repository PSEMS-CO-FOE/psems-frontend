import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export type SupervisorRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// A course a lecturer can find and ask to join. Metadata only — never the ideas
// inside, since accepted supervisors can see groups' restricted ideas.
export interface OpenCourse {
  id: string;
  name: string;
  department: string;
  academicYear: string;
  projectType: string;
  createdBy: { fullName: string | null; email: string };
  _count: { groups: number; supervisors: number };
  requestStatus: SupervisorRequestStatus | null;
}

export interface SupervisorRequest {
  id: string;
  status: SupervisorRequestStatus;
  note: string | null;
  createdAt: string;
  decidedAt: string | null;
  lecturer: { id: string; user: { id: string; email: string; fullName: string | null } };
}

export function useOpenCourses() {
  return useQuery({
    queryKey: ['openCourses'],
    queryFn: async () => {
      const res = await api.get<OpenCourse[]>('/courses/open');
      return res.data;
    },
  });
}

// The note is optional — a lecturer can simply ask.
export function useRequestToSupervise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { cpiId: string; note?: string }) => {
      const res = await api.post(`/courses/${args.cpiId}/supervisor-requests`, { note: args.note });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['openCourses'] }),
  });
}

export function useSupervisorRequests(cpiId: string) {
  return useQuery({
    queryKey: ['supervisorRequests', cpiId],
    queryFn: async () => {
      const res = await api.get<SupervisorRequest[]>(`/courses/${cpiId}/supervisor-requests`);
      return res.data;
    },
  });
}

// Approving creates a supervisor invitation, which the lecturer still has to
// accept — they asked to be considered, not to be enrolled.
export function useDecideSupervisorRequest(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { requestId: string; decision: 'APPROVE' | 'REJECT' }) => {
      const res = await api.post(`/courses/${cpiId}/supervisor-requests/${args.requestId}`, {
        decision: args.decision,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisorRequests', cpiId] });
      queryClient.invalidateQueries({ queryKey: ['cpiDetail', cpiId] });
    },
  });
}
