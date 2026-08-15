import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export type SessionStatus = 'SCHEDULED' | 'AWAITING_REVIEW' | 'CORRECTION_REQUESTED' | 'FINALIZED';

export interface EvaluationSession {
  id: string;
  status: SessionStatus;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  allocatedMinutes: number | null;
  location: string | null;
  presentationDurationSeconds: number | null;
  // Shared timer state (server is the source of truth; clients poll).
  timerRunning: boolean;
  timerElapsedSeconds: number;
  currentSegmentIndex: number;
  // Derived server-side: scheduled time passed but still SCHEDULED (no scores).
  isOverdue: boolean;
  group: { id: string; name: string };
  stage: { id: string; name: string };
}

export type ConflictKind =
  | 'PANELIST_DOUBLE_BOOKED'
  | 'GROUP_DOUBLE_BOOKED'
  | 'ROOM_DOUBLE_BOOKED'
  | 'OUTSIDE_AVAILABILITY'
  | 'REQUIRED_PANELIST_MISSING';

// A warning, not an error. Show it, but the booking still went through.
export interface ScheduleConflict {
  kind: ConflictKind;
  message: string;
  sessionId?: string;
  people?: { userId: string | null; name: string }[];
}

export type AvailabilityStatus = 'AVAILABLE' | 'TENTATIVE' | 'UNAVAILABLE';

export interface AvailabilityTemplateSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  orderIndex: number;
}

export interface AvailabilityTemplate {
  id: string;
  windowStart: string;
  windowEnd: string;
  slots: AvailabilityTemplateSlot[];
  dates: string[];
}

export interface AvailabilityEntry {
  templateSlotId: string;
  slotDate: string;
  status: AvailabilityStatus;
  note: string | null;
}

interface MyAvailability {
  template: AvailabilityTemplate | null;
  required: boolean;
  entries: AvailabilityEntry[];
}

interface CoordinatorAvailability {
  template: AvailabilityTemplate | null;
  entries: (AvailabilityEntry & {
    lecturerId: string;
    lecturer: { id: string; user: { id: string; fullName: string; email: string } };
    templateSlot: { id: string; name: string; orderIndex: number };
  })[];
  outstanding: { id: string; user: { id: string; fullName: string; email: string } }[];
}

export interface AlternativeSlot {
  slotDate: string;
  templateSlotId: string;
  slotName: string;
  start: string;
  end: string;
  allAvailable: boolean;
  tentative: string[];
  sessionsAlreadyInSlot: number;
}

export interface ScheduleSheet {
  courseName: string;
  academicYear: string;
  venue: string | null;
  unscheduled: number;
  rows: {
    groupName: string;
    stageName: string;
    location: string | null;
    scheduledStart: string | null;
    scheduledEnd: string | null;
    members: { no: number; indexNumber: string; registrationNumber: string | null; name: string }[];
  }[];
}

function sessionsKey(cpiId: string) {
  return ['sessions', cpiId] as const;
}
function availabilityKey(cpiId: string) {
  return ['availability', cpiId] as const;
}
function myAvailabilityKey(cpiId: string) {
  return ['availability', cpiId, 'mine'] as const;
}

// Pass refetchInterval to keep a page up to date, e.g. so every evaluator sees
// the same timer.
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

export function useAvailabilityTemplate(cpiId: string) {
  return useQuery({
    queryKey: [...availabilityKey(cpiId), 'template'],
    queryFn: async () => {
      const res = await api.get<AvailabilityTemplate | null>(`/courses/${cpiId}/availability/template`);
      return res.data;
    },
  });
}

export function useSetAvailabilityTemplate(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      windowStart: string;
      windowEnd: string;
      slots: { name: string; startTime: string; endTime: string }[];
    }) => {
      const res = await api.put<AvailabilityTemplate>(`/courses/${cpiId}/availability/template`, args);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityKey(cpiId) }),
  });
}

// A lecturer's own answers, and whether this course expects them to reply.
export function useMyAvailability(cpiId: string) {
  return useQuery({
    queryKey: myAvailabilityKey(cpiId),
    queryFn: async () => {
      const res = await api.get<MyAvailability>(`/courses/${cpiId}/availability/mine`);
      return res.data;
    },
  });
}

// Sends the whole grid, so clearing a cell is how a lecturer takes a slot back.
export function useSubmitAvailability(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entries: { templateSlotId: string; slotDate: string; status: AvailabilityStatus; note?: string }[]) => {
      const res = await api.put<MyAvailability>(`/courses/${cpiId}/availability`, { entries });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityKey(cpiId) }),
  });
}

export function useAvailability(cpiId: string) {
  return useQuery({
    queryKey: availabilityKey(cpiId),
    queryFn: async () => {
      const res = await api.get<CoordinatorAvailability>(`/courses/${cpiId}/availability`);
      return res.data;
    },
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

export interface ScheduleArgs {
  sessionId: string;
  scheduledStart: string;
  scheduledEnd: string;
  location?: string;
  allocatedMinutes?: number;
}

export function useScheduleSession(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, ...body }: ScheduleArgs) => {
      const res = await api.put<ScheduleResult>(`/courses/${cpiId}/sessions/${sessionId}/schedule`, body);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey(cpiId) }),
  });
}

// Book several sessions in one request instead of one request per group.
export function useScheduleSessions(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entries: ScheduleArgs[]) => {
      const res = await api.put<{
        scheduled: number;
        results: { sessionId: string; conflicts: ScheduleConflict[] }[];
      }>(`/courses/${cpiId}/sessions/schedule`, { entries });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsKey(cpiId) }),
  });
}

// Only loaded when asked for, after a clash has been shown.
export function useAlternativeSlots(cpiId: string, sessionId: string | null) {
  return useQuery({
    queryKey: ['alternative-slots', cpiId, sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const res = await api.get<AlternativeSlot[]>(`/courses/${cpiId}/sessions/${sessionId}/alternative-slots`);
      return res.data;
    },
  });
}

export function useScheduleSheet(cpiId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['schedule-sheet', cpiId],
    enabled,
    queryFn: async () => {
      const res = await api.get<ScheduleSheet>(`/courses/${cpiId}/schedule-sheet`);
      return res.data;
    },
  });
}
