import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

type SelectionStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

interface IdeaRef {
  id: string;
  title: string;
  authorType: 'COORDINATOR' | 'SUPERVISOR' | 'STUDENT' | 'LECTURER';
}
interface SupervisorRef {
  user: { id: string; email: string; fullName: string | null };
}

export interface ProjectSelection {
  id: string;
  status: SelectionStatus;
  ideaId: string;
  idea: IdeaRef;
  group: { id: string; name: string };
  supervisor: SupervisorRef | null;
  createdAt: string;
  respondedAt: string | null;
}

export type EoiType =
  | 'GROUP_INTEREST'
  | 'SEEKING_SUPERVISOR'
  | 'SUPERVISOR_WILLING'
  | 'LECTURER_INTEREST'
  | 'CO_SUPERVISION_INTEREST';

export interface InterestExpression {
  id: string;
  type: EoiType;
  idea: IdeaRef;
  group: { id: string; name: string } | null;
  supervisor: SupervisorRef | null;
  // Soft withdrawal: the row stays so re-expressing revives it rather than
  // colliding with the unique pair.
  withdrawnAt: string | null;
}

// A student idea flagged as seeking a supervisor, that a supervisor may mark
// willing on.
export interface SeekingIdea {
  ideaId: string;
  idea: IdeaRef;
  group: { id: string; name: string } | null;
}

// Role-tagged union returned by GET /selection.
export type SelectionState =
  | { role: 'STUDENT'; groupInterest: InterestExpression[]; willingSupervisors: InterestExpression[]; selection: ProjectSelection | null }
  | { role: 'COORDINATOR'; selections: ProjectSelection[]; interestExpressions: InterestExpression[] }
  | {
      role: 'SUPERVISOR';
      willingByMe: InterestExpression[];
      pendingSelections: ProjectSelection[];
      seekingIdeas: SeekingIdea[];
      // Groups that registered interest in one of this supervisor's ideas.
      interestInMyIdeas: InterestExpression[];
    };

function selectionKey(cpiId: string) {
  return ['selection', cpiId] as const;
}

export function useSelectionState(cpiId: string) {
  return useQuery({
    queryKey: selectionKey(cpiId),
    queryFn: async () => {
      const res = await api.get<SelectionState>(`/courses/${cpiId}/selection`);
      return res.data;
    },
  });
}

// Factory for the selection mutations — each posts a body then refetches state.
function useSelectionAction<TArgs>(cpiId: string, request: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: selectionKey(cpiId) }),
  });
}

// Interest is flat — no ranking. A group simply says "we would like this one".
export function useExpressInterest(cpiId: string) {
  return useSelectionAction(cpiId, (ideaId: string) =>
    api.post(`/courses/${cpiId}/selection/interest`, { ideaId }),
  );
}

// The mirror image: a lecturer says they would like to take on a group's idea.
export function useLecturerInterest(cpiId: string) {
  return useSelectionAction(cpiId, (ideaId: string) =>
    api.post(`/courses/${cpiId}/selection/lecturer-interest`, { ideaId }),
  );
}

// A lecturer offering to co-supervise somebody else's idea.
export function useCoSupervisionInterest(cpiId: string) {
  return useSelectionAction(cpiId, (ideaId: string) =>
    api.post(`/courses/${cpiId}/selection/co-supervision-interest`, { ideaId }),
  );
}

// Withdrawal only works while the selection phase is open, and frees a slot
// against the course's interest cap.
export function useWithdrawInterest(cpiId: string) {
  return useSelectionAction(cpiId, (args: { ideaId: string; type: EoiType }) =>
    api.delete(`/courses/${cpiId}/selection/interest/${args.ideaId}`, { params: { type: args.type } }),
  );
}
export function useSeekingSupervisor(cpiId: string) {
  return useSelectionAction(cpiId, (ideaId: string) =>
    api.post(`/courses/${cpiId}/selection/seeking-supervisor`, { ideaId }),
  );
}
export function useMarkWilling(cpiId: string) {
  return useSelectionAction(cpiId, (ideaId: string) =>
    api.post(`/courses/${cpiId}/selection/willing`, { ideaId }),
  );
}
export function useSelectProject(cpiId: string) {
  return useSelectionAction(cpiId, (args: { ideaId: string; supervisorUserId?: string }) =>
    api.post(`/courses/${cpiId}/selection/select`, args),
  );
}
export function useRespondSelection(cpiId: string) {
  return useSelectionAction(cpiId, (args: { selectionId: string; decision: 'ACCEPT' | 'DECLINE' }) =>
    api.post(`/courses/${cpiId}/selection/${args.selectionId}/respond`, { decision: args.decision }),
  );
}
