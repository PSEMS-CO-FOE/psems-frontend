import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type { PanelRole } from '@/features/panel/usePanel';

export interface ReviewScore {
  panelistId: string;
  role: PanelRole;
  name: string;
  affiliation: string | null;
  userId: string | null;
  score: number;
  comment: string | null;
  deviation: number;
}

export interface ReviewCriterion {
  criterionId: string;
  name: string;
  level: 'GROUP' | 'INDIVIDUAL';
  student: { id: string; studentId: string; user: { fullName: string | null } } | null;
  maxScore: number;
  mean: number;
  spread: number;
  flagged: boolean;
  scores: ReviewScore[];
}

export interface OverallComment {
  panelistId: string;
  role: PanelRole;
  name: string;
  affiliation: string | null;
  comment: string;
  submittedAt: string;
}

export interface SessionReadiness {
  scoresSubmitted: number;
  panelistsFinished: number;
  roles: { role: PanelRole; minRequired: number; finished: number; met: boolean }[];
  allRequirementsMet: boolean;
}

export interface SessionReview {
  sessionId: string;
  status: string;
  // Reported, never acted on: sessions do not advance by themselves, so this is
  // what tells the reviewer whether it is safe to end marking.
  readiness: SessionReadiness | null;
  criteria: ReviewCriterion[];
  overallComments: OverallComment[];
}

// Whoever reviews a session is resolved server-side — the Head Judge when the
// course enables one, otherwise the coordinator. Anyone else gets a 403, so
// don't retry.
export function useSessionReview(cpiId: string, sessionId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['review', cpiId, sessionId],
    enabled,
    retry: false,
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

// Ends marking. Deliberately a separate act from approving: only the person
// running the room knows when it is over.
export function useCloseScoring(cpiId: string, sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/courses/${cpiId}/sessions/${sessionId}/close-scoring`);
      return res.data;
    },
    onSuccess: () => invalidateSessionData(queryClient, cpiId, sessionId),
  });
}

// Re-scrutinise: undo a close or an approval and put marking back in play.
// Refused once the stage's marks have been aggregated.
export function useReopenSession(cpiId: string, sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reason: string) => {
      const res = await api.post(`/courses/${cpiId}/sessions/${sessionId}/reopen`, { reason });
      return res.data;
    },
    onSuccess: () => invalidateSessionData(queryClient, cpiId, sessionId),
  });
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
    mutationFn: async (args: { panelistId: string; reason: string }) => {
      const res = await api.post(`/courses/${cpiId}/sessions/${sessionId}/request-correction`, args);
      return res.data;
    },
    onSuccess: () => invalidateSessionData(queryClient, cpiId, sessionId),
  });
}
