import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export type TimerAction = 'start' | 'pause' | 'next' | 'previous' | 'stop' | 'reset';
export type SegmentTimeliness = 'ON_TIME' | 'OVERTIME' | 'UNDER';

export interface TimerSegment {
  id: string;
  orderIndex: number;
  name: string;
  targetSeconds: number;
  elapsedSeconds: number;
  running: boolean;
  completedAt: string | null;
  overranSeconds: number;
  timeliness: SegmentTimeliness | null;
  timelinessManual: boolean;
}

export interface TimerState {
  sessionId: string;
  group: string;
  stage: string;
  running: boolean;
  elapsedSeconds: number;
  presentationDurationSeconds: number | null;
  currentSegmentIndex: number;
  segments: TimerSegment[];
}

function timerKey(cpiId: string, sessionId: string) {
  return ['timer', cpiId, sessionId] as const;
}

// A small, separate request, because the timer window asks for it every second.
export function useTimer(cpiId: string, sessionId: string, options?: { refetchInterval?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: timerKey(cpiId, sessionId),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? 1000,
    queryFn: async () => {
      const res = await api.get<TimerState>(`/courses/${cpiId}/sessions/${sessionId}/timer`);
      return res.data;
    },
  });
}

export function useControlTimer(cpiId: string, sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: TimerAction) => {
      const res = await api.post<TimerState>(`/courses/${cpiId}/sessions/${sessionId}/timer`, { action });
      return res.data;
    },
    onSuccess: (data) => {
      // Use the reply straight away so the clock does not freeze until the next check.
      queryClient.setQueryData(timerKey(cpiId, sessionId), data);
      queryClient.invalidateQueries({ queryKey: ['sessions', cpiId] });
    },
  });
}

export function useSetSegmentTimeliness(cpiId: string, sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { segmentId: string; timeliness: SegmentTimeliness }) => {
      const res = await api.post<TimerState>(
        `/courses/${cpiId}/sessions/${sessionId}/segments/${args.segmentId}/timeliness`,
        { timeliness: args.timeliness },
      );
      return res.data;
    },
    onSuccess: (data) => queryClient.setQueryData(timerKey(cpiId, sessionId), data),
  });
}

export function formatClock(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const minutes = Math.floor(abs / 60);
  const seconds = abs % 60;
  return `${totalSeconds < 0 ? '-' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
