import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type { Cpi, CpiParticipationMode, CpiProjectType } from './types';

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

// CPIs a student can open (their department + any they've joined) — so they
// pick from a list instead of pasting a CPI id.
export interface StudentCpi {
  id: string;
  name: string;
  department: string;
  academicYear: string;
  projectType: string;
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
