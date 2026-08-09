import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export type PanelRole =
  | 'COORDINATOR'
  | 'SUPERVISOR'
  | 'CO_SUPERVISOR'
  | 'SENIOR_EVALUATOR'
  | 'EVALUATOR'
  | 'JUNIOR_EVALUATOR'
  | 'HEAD_JUDGE';

export type MarkCounting = 'COUNTED' | 'ADVISORY' | 'COORDINATOR_DECIDES';

export const PANEL_ROLES: PanelRole[] = [
  'COORDINATOR',
  'SUPERVISOR',
  'CO_SUPERVISOR',
  'SENIOR_EVALUATOR',
  'EVALUATOR',
  'JUNIOR_EVALUATOR',
  'HEAD_JUDGE',
];

// A head judge reviews rather than marks — mirrors SCORING_ROLES on the server.
export const SCORING_PANEL_ROLES: PanelRole[] = PANEL_ROLES.filter((r) => r !== 'HEAD_JUDGE');

export const roleLabel = (role: PanelRole) =>
  role.charAt(0) + role.slice(1).toLowerCase().replace(/_/g, ' ');

export interface Panelist {
  id: string;
  role: PanelRole;
  weightPercent: number | null;
  markCounting: MarkCounting | null;
  effectiveMarkCounting: MarkCounting;
  user: { id: string; email: string; fullName: string | null } | null;
  guest: { id: string; fullName: string; email: string; organization: string | null; revokedAt: string | null } | null;
  evaluation: { overallComment: string; submittedAt: string } | null;
}

export interface StagePanelRule {
  id: string;
  role: PanelRole;
  minRequired: number;
  maxAllowed: number | null;
  weightPercent: number | null;
  markCounting: MarkCounting;
  openToAll: boolean;
}

export interface SessionPanel {
  sessionId: string;
  stage: { id: string; name: string };
  rules: StagePanelRule[];
  panelists: Panelist[];
}

export interface GuestPanelist {
  id: string;
  fullName: string;
  email: string;
  organization: string | null;
  tokenExpiresAt: string;
  revokedAt: string | null;
  panelSeats: {
    id: string;
    role: PanelRole;
    evaluationSessionId: string;
    session: { stage: { name: string }; group: { name: string } };
  }[];
}

const panelKey = (cpiId: string, sessionId: string) => ['panel', cpiId, sessionId] as const;
const guestsKey = (cpiId: string) => ['guests', cpiId] as const;

export function useSessionPanel(cpiId: string, sessionId: string, enabled = true) {
  return useQuery({
    queryKey: panelKey(cpiId, sessionId),
    enabled,
    retry: false,
    queryFn: async () => {
      const res = await api.get<SessionPanel>(`/courses/${cpiId}/sessions/${sessionId}/panel`);
      return res.data;
    },
  });
}

function useInvalidatePanel(cpiId: string, sessionId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: panelKey(cpiId, sessionId) });
    queryClient.invalidateQueries({ queryKey: ['sessions', cpiId] });
  };
}

export function useAddPanelist(cpiId: string, sessionId: string) {
  const invalidate = useInvalidatePanel(cpiId, sessionId);
  return useMutation({
    mutationFn: async (args: { userId: string; role: PanelRole; markCounting?: MarkCounting; weightPercent?: number }) => {
      const res = await api.post(`/courses/${cpiId}/sessions/${sessionId}/panel`, args);
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdatePanelist(cpiId: string, sessionId: string) {
  const invalidate = useInvalidatePanel(cpiId, sessionId);
  return useMutation({
    mutationFn: async (args: {
      panelistId: string;
      role?: PanelRole;
      markCounting?: MarkCounting | null;
      weightPercent?: number | null;
    }) => {
      const { panelistId, ...body } = args;
      const res = await api.patch(`/courses/${cpiId}/sessions/${sessionId}/panel/${panelistId}`, body);
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useRemovePanelist(cpiId: string, sessionId: string) {
  const invalidate = useInvalidatePanel(cpiId, sessionId);
  return useMutation({
    mutationFn: async (panelistId: string) => {
      const res = await api.delete(`/courses/${cpiId}/sessions/${sessionId}/panel/${panelistId}`);
      return res.data;
    },
    onSuccess: invalidate,
  });
}

// Joining an evaluation that is open to all — the demo-day case.
export function useJoinPanel(cpiId: string, sessionId: string) {
  const invalidate = useInvalidatePanel(cpiId, sessionId);
  return useMutation({
    mutationFn: async (role: PanelRole = 'EVALUATOR') => {
      const res = await api.post(`/courses/${cpiId}/sessions/${sessionId}/panel/join`, { role });
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useGuests(cpiId: string) {
  return useQuery({
    queryKey: guestsKey(cpiId),
    queryFn: async () => {
      const res = await api.get<GuestPanelist[]>(`/courses/${cpiId}/guests`);
      return res.data;
    },
  });
}

// The raw link comes back exactly once, on invite. Only its hash is stored, so
// it can never be read back — the caller must show or send it immediately.
export function useInviteGuest(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      fullName: string;
      email: string;
      organization?: string;
      sessionIds: string[];
      role: PanelRole;
    }) => {
      const res = await api.post<{ guest: GuestPanelist; token: string; expiresAt: string }>(
        `/courses/${cpiId}/guests`,
        args,
      );
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: guestsKey(cpiId) }),
  });
}

export function useRevokeGuest(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (guestId: string) => {
      const res = await api.post(`/courses/${cpiId}/guests/${guestId}/revoke`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: guestsKey(cpiId) }),
  });
}
