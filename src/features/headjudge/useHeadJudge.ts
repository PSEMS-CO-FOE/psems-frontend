import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface ReviewCriterion {
  criterionId: string;
  name: string;
  maxScore: number;
  mean: number;
  spread: number;
  flagged: boolean;
  scores: {
    evaluator: { email: string; fullName: string | null };
    score: number;
    comment: string | null;
    deviation: number;
  }[];
}

export interface SessionReview {
  sessionId: string;
  status: string;
  criteria: ReviewCriterion[];
}

export function useSessionReview(cpiId: string, sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['review', cpiId, sessionId],
    enabled,
    retry: false, // non-Head-Judge callers get 403 — don't retry
    queryFn: async () => {
      const res = await api.get<SessionReview>(`/courses/${cpiId}/sessions/${sessionId}/review`);
      return res.data;
    },
  });
}

function invalidateSessionData(queryClient: ReturnType<typeof useQueryClient>, cpiId: string, sessionId: string) {
  queryClient.invalidateQueries({ queryKey: ['review', cpiId, sessionId] });
  queryClient.invalidateQueries({ queryKey: ['sessions', cpiId] });
}

export function useApproveSession(cpiId: string, sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/courses/${cpiId}/sessions/${sessionId}/approve`);
      return res.data;
    },
    onSuccess: () => invalidateSessionData(queryClient, cpiId, sessionId),
  });
}

export function useRequestCorrection(cpiId: string, sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { evaluatorUserId: string; reason: string }) => {
      const res = await api.post(`/courses/${cpiId}/sessions/${sessionId}/request-correction`, args);
      return res.data;
    },
    onSuccess: () => invalidateSessionData(queryClient, cpiId, sessionId),
  });
}
