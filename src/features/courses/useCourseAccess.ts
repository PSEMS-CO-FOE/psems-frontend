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

export interface AddableStudent {
  id: string;
  studentId: string;
  registrationNumber: string | null;
  batch: string;
  user: { fullName: string | null; email: string };
  // Set when they already asked and were answered, so a declined request is not
  // shown as if it were a fresh candidate.
  existingRequest: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}

// Students from another batch the coordinator could take on. Searching is done
// on the server so the whole department is reachable, not just a first page.
export function useAddableStudents(cpiId: string, q: string, enabled: boolean) {
  return useQuery({
    queryKey: [...courseKey(cpiId), 'addable-students', q],
    enabled,
    queryFn: async () => {
      const res = await api.get<AddableStudent[]>(`/courses/${cpiId}/addable-students`, {
        params: q ? { q } : {},
      });
      return res.data;
    },
  });
}

// The coordinator starting the enrolment rather than answering a request. The
// student never has to know to ask.
export function useAddStudent(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { studentId: string; note?: string }) => {
      const res = await api.post(`/courses/${cpiId}/added-students`, args);
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
