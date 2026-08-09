import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type { PanelRole } from './usePanel';

export interface GuestCriterion {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  maxScore: number;
  level: 'GROUP' | 'INDIVIDUAL';
}

export interface GuestSession {
  panelistId: string;
  role: PanelRole;
  sessionId: string;
  status: string;
  scheduledStart: string | null;
  location: string | null;
  group: { id: string; name: string };
  stage: { id: string; name: string; panelScoreVisibility: string };
  criteria: GuestCriterion[];
  members: { id: string; studentId: string; user: { fullName: string | null } }[];
  ownScores: { rubricCriterionId: string; studentId: string | null; score: number; comment: string | null }[];
  overallComment: string | null;
}

export interface GuestWorkspace {
  guest: { fullName: string; email: string; organization: string | null };
  courseInstance: { id: string; name: string };
  expiresAt: string;
  sessions: GuestSession[];
}

const workspaceKey = (token: string) => ['guestWorkspace', token] as const;

// Authenticated by the link alone — these two calls are the only ones a guest
// can reach, and they carry no bearer token.
export function useGuestWorkspace(token: string) {
  return useQuery({
    queryKey: workspaceKey(token),
    enabled: Boolean(token),
    retry: false,
    queryFn: async () => {
      const res = await api.get<GuestWorkspace>('/guest/workspace', { params: { token } });
      return res.data;
    },
  });
}

export function useSubmitGuestScores(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      sessionId: string;
      scores: { criterionId: string; studentId?: string; score: number; comment?: string }[];
      overallComment?: string;
    }) => {
      const res = await api.post('/guest/scores', { token, ...args });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKey(token) }),
  });
}
