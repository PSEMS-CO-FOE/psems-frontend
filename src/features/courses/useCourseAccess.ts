import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type { CourseStatus } from './types';

// Who a course is for, what state it is in, and who asked to join it late.

export type Working = 'IN_GROUP' | 'ALONE' | 'NOT_STARTED';

export interface RosterRow {
  studentId: string;
  indexNumber: string;
  name: string;
  group: { id: string; name: string; size: number } | null;
  working: Working;
  // The group is over or under the size the coordinator asked for. Advisory —
  // the batch rarely divides evenly.
  offTarget: boolean;
}

export interface Roster {
  batch: string;
  targetGroupSize: number | null;
  total: number;
  inGroups: number;
  alone: number;
  notStarted: number;
  rows: RosterRow[];
}

export interface JoinRequest {
  id: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  decidedAt: string | null;
  student: {
    id: string;
    studentId: string;
    batch: string;
    user: { fullName: string; email: string };
  };
}

function courseKey(cpiId: string) {
  return ['courses', cpiId] as const;
}

export function useCourseRoster(cpiId: string) {
  return useQuery({
    queryKey: [...courseKey(cpiId), 'roster'],
    queryFn: async () => {
      const res = await api.get<Roster>(`/courses/${cpiId}/roster`);
      return res.data;
    },
  });
}

export function useSetCourseStatus(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: CourseStatus) => {
      const res = await api.post(`/courses/${cpiId}/status`, { status });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
  });
}

export function useJoinRequests(cpiId: string) {
  return useQuery({
    queryKey: [...courseKey(cpiId), 'join-requests'],
    queryFn: async () => {
      const res = await api.get<JoinRequest[]>(`/courses/${cpiId}/join-requests`);
      return res.data;
    },
  });
}

// Approving is the access — there is no separate grant to hand out afterwards.
export function useDecideJoinRequest(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { requestId: string; approve: boolean; note?: string }) => {
      const res = await api.post(`/courses/${cpiId}/join-requests/${args.requestId}`, {
        approve: args.approve,
        note: args.note,
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: courseKey(cpiId) }),
  });
}

// Batches this department already uses, so the same code is not typed two
// different ways on two different days.
export function useDepartmentBatches() {
  return useQuery({
    queryKey: ['courses', 'batches'],
    queryFn: async () => {
      const res = await api.get<string[]>('/courses/batches');
      return res.data;
    },
  });
}
