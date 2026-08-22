import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type { Cpi, CourseStatus, CpiParticipationMode, CpiProjectType } from './types';

const coursesKey = ['courses'] as const;

export function useCourses() {
  return useQuery({
    queryKey: coursesKey,
    queryFn: async () => {
      const res = await api.get<Cpi[]>('/courses');
      return res.data;
    },
  });
}

// Non-sensitive CPI summary any participant can read (e.g. to show the course
// name in a header instead of its id).
export interface CpiSummary {
  id: string;
  name: string;
  department: string;
  academicYear: string;
  projectType: string;
  participationMode: string;
  mode: string | null;
}

export function useCpiSummary(cpiId: string) {
  return useQuery({
    queryKey: ['courses', 'summary', cpiId],
    enabled: !!cpiId,
    queryFn: async () => {
      const res = await api.get<CpiSummary>(`/courses/${cpiId}/summary`);
      return res.data;
    },
  });
}

// Courses a student can open: their own batch's active ones, everything they
// have already joined, and anything they were approved to join late.
export interface StudentCpi {
  id: string;
  name: string;
  department: string;
  batch: string;
  status: CourseStatus;
  academicYear: string;
  projectType: string;
}

// An active course in the student's department for another batch — name and
// batch only, never contents. This is how a repeated student names the course
// they want to ask for.
export interface OtherBatchCpi {
  id: string;
  name: string;
  batch: string;
  projectType: string;
  academicYear: string;
  request: { status: 'PENDING' | 'APPROVED' | 'REJECTED'; reason: string } | null;
}

export function useOtherBatchCpis() {
  return useQuery({
    queryKey: ['courses', 'other-batches'],
    queryFn: async () => {
      const res = await api.get<OtherBatchCpi[]>('/courses/other-batches');
      return res.data;
    },
  });
}

export function useRequestToJoin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { cpiId: string; reason: string }) => {
      const res = await api.post(`/courses/${args.cpiId}/join-requests`, { reason: args.reason });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
  });
}

export function useStudentCpis() {
  return useQuery({
    queryKey: ['courses', 'mine', 'student'],
    queryFn: async () => {
      const res = await api.get<StudentCpi[]>('/courses/mine/student');
      return res.data;
    },
  });
}

// CPIs a lecturer can open, with their role(s) in each.
export interface LecturerCpi {
  id: string;
  name: string;
  department: string;
  academicYear: string;
  roles: string[];
}

export function useLecturerCpis() {
  return useQuery({
    queryKey: ['courses', 'mine', 'lecturer'],
    queryFn: async () => {
      const res = await api.get<LecturerCpi[]>('/courses/mine/lecturer');
      return res.data;
    },
  });
}

export interface CreateCpiArgs {
  name: string;
  projectType: CpiProjectType;
  participationMode: CpiParticipationMode;
  department: string;
  academicYear: string;
}

export function useCreateCpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: CreateCpiArgs) => {
      const res = await api.post<Cpi>('/courses', args);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursesKey });
    },
  });
}
