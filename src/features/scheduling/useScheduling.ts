import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export type SessionStatus = 'SCHEDULED' | 'AWAITING_HEAD_JUDGE' | 'CORRECTION_REQUESTED' | 'FINALIZED';

export interface EvaluationSession {
  id: string;
  status: SessionStatus;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  group: { id: string; name: string };
  stage: { id: string; name: string };
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

export function useSessions(cpiId: string) {
  return useQuery({
    queryKey: sessionsKey(cpiId),
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

export function useScheduleSession(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { sessionId: string; scheduledStart: string; scheduledEnd: string }) => {
      const res = await api.put(`/courses/${cpiId}/sessions/${args.sessionId}/schedule`, {
        scheduledStart: args.scheduledStart,
        scheduledEnd: args.scheduledEnd,
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey(cpiId) }),
  });
}
