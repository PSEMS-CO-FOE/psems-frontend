import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/lib/apiClient';

export interface GroupMarks {
  groupId: string;
  groupName: string;
  overall: number;
  stages: {
    stageId: string;
    stageName: string;
    weight: number;
    stageScorePercent: number;
    weightedContribution: number;
  }[];
}

function marksKey(cpiId: string) {
  return ['marks', cpiId] as const;
}

// Coordinator: full list. Student: own group only, after publish.
export function useMarks(cpiId: string, opts?: { treat403AsEmpty?: boolean }) {
  return useQuery({
    queryKey: marksKey(cpiId),
    queryFn: async () => {
      const res = await api.get<GroupMarks[]>(`/courses/${cpiId}/marks`);
      return res.data;
    },
    // A student hitting this before publish gets 403 — that's an expected state,
    // not a real error, so don't retry it.
    retry: (count, error) => {
      if (opts?.treat403AsEmpty && error instanceof AxiosError && error.response?.status === 403) {
        return false;
      }
      return count < 1;
    },
  });
}

export function useAggregateMarks(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<GroupMarks[]>(`/courses/${cpiId}/marks/aggregate`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: marksKey(cpiId) }),
  });
}

export function usePublishMarks(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/courses/${cpiId}/marks/publish`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: marksKey(cpiId) }),
  });
}
