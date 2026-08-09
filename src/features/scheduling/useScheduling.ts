import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export type SessionStatus = 'SCHEDULED' | 'AWAITING_REVIEW' | 'CORRECTION_REQUESTED' | 'FINALIZED';

export interface EvaluationSession {
  id: string;
  status: SessionStatus;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  location: string | null;
  presentationDurationSeconds: number | null;
  // Shared timer state (server is the source of truth; clients poll).
  timerRunning: boolean;
  timerElapsedSeconds: number;
  // Derived server-side: scheduled time passed but still SCHEDULED (no scores).
  isOverdue: boolean;
  group: { id: string; name: string };
  stage: { id: string; name: string };
}

// A double-booking surfaced (not blocked) when scheduling: another session
// sharing an assigned evaluator overlaps the proposed time.
export interface ScheduleConflict {
  sessionId: string;
  group: string;
  stage: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
}

export interface AvailabilitySlot {
  id: string;
  slotStart: string;
  slotEnd: string;
  cpiEvaluator: { lecturer: { user: { email: string; fullName: string | null } } };
}

function sessionsKey(cpiId: string) {
  return ['sessions', cpiId] as const;
}
function availabilityKey(cpiId: string) {
  return ['availability', cpiId] as const;
}

// refetchInterval lets a page poll (e.g. to keep the shared timer in sync
// across evaluators).
export function useSessions(cpiId: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: sessionsKey(cpiId),
    refetchInterval: options?.refetchInterval,
    queryFn: async () => {
      const res = await api.get<EvaluationSession[]>(`/courses/${cpiId}/sessions`);
      return res.data;
    },
  });
}

export function useAvailability(cpiId: string) {
  return useQuery({
    queryKey: availabilityKey(cpiId),
    queryFn: async () => {
      const res = await api.get<AvailabilitySlot[]>(`/courses/${cpiId}/availability`);
      return res.data;
    },
  });
}

export function useSubmitAvailability(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { slotStart: string; slotEnd: string }) => {
      const res = await api.post(`/courses/${cpiId}/availability`, args);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityKey(cpiId) }),
  });
}

export function useGenerateSessions(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/courses/${cpiId}/sessions/generate`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey(cpiId) }),
  });
}

interface ScheduleResult {
  session: EvaluationSession;
  conflicts: ScheduleConflict[];
}

export function useScheduleSession(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      sessionId: string;
      scheduledStart: string;
      scheduledEnd: string;
      location?: string;
    }) => {
      const res = await api.put<ScheduleResult>(`/courses/${cpiId}/sessions/${args.sessionId}/schedule`, {
        scheduledStart: args.scheduledStart,
        scheduledEnd: args.scheduledEnd,
        location: args.location,
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey(cpiId) }),
  });
}

// Control the shared presentation timer (start/pause/stop/reset). State lives
// on the server, so all evaluators viewing the session see the same clock.
export function useControlTimer(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { sessionId: string; action: 'start' | 'pause' | 'stop' | 'reset' }) => {
      const res = await api.post(`/courses/${cpiId}/sessions/${args.sessionId}/timer`, { action: args.action });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey(cpiId) }),
  });
}
