import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

// For an evaluator, GET scores returns ONLY their own scores (server-enforced
// isolation). We never fetch or cache other evaluators' scores here.
export interface OwnScore {
  id: string;
  score: number;
  comment: string | null;
  rubricCriterionId: string;
  criterion: { id: string; name: string; maxScore: number };
}

function scoresKey(cpiId: string, sessionId: string) {
  return ['scores', cpiId, sessionId] as const;
}

export function useSessionScores(cpiId: string, sessionId: string, enabled = true) {
  return useQuery({
    queryKey: scoresKey(cpiId, sessionId),
    enabled,
    queryFn: async () => {
      const res = await api.get<OwnScore[]>(`/courses/${cpiId}/sessions/${sessionId}/scores`);
      return res.data;
    },
  });
}

export function useSubmitScores(cpiId: string, sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scores: { criterionId: string; score: number; comment?: string }[]) => {
      const res = await api.post(`/courses/${cpiId}/sessions/${sessionId}/scores`, { scores });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scoresKey(cpiId, sessionId) });
      queryClient.invalidateQueries({ queryKey: ['sessions', cpiId] });
    },
  });
}
