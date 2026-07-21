import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type { CpiDetail, CpiPhaseName, TimelinePhase } from './types';

export function cpiDetailKey(cpiId: string) {
  return ['courses', cpiId] as const;
}

export function useCpiDetail(cpiId: string) {
  return useQuery({
    queryKey: cpiDetailKey(cpiId),
    queryFn: async () => {
      const res = await api.get<CpiDetail>(`/courses/${cpiId}`);
      return res.data;
    },
  });
}

export interface TimelineInputPhase {
  phase: CpiPhaseName;
  startDate: string; // YYYY-MM-DD
  endDate: string;
}

export function useSetTimeline(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (phases: TimelineInputPhase[]) => {
      const res = await api.put<TimelinePhase[]>(`/courses/${cpiId}/timeline`, { phases });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cpiDetailKey(cpiId) });
    },
  });
}
