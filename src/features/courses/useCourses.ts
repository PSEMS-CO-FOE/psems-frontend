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
