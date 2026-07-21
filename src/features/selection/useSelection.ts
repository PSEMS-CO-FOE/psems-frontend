import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

type SelectionStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

interface IdeaRef {
  id: string;
  title: string;
  authorType: 'COORDINATOR' | 'SUPERVISOR' | 'STUDENT';
}
interface SupervisorRef {
  user: { email: string; fullName: string | null };
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

export interface InterestExpression {
  id: string;
  type: 'GROUP_INTEREST' | 'SEEKING_SUPERVISOR' | 'SUPERVISOR_WILLING';
  rank: number | null;
  idea: IdeaRef;
  supervisor: SupervisorRef | null;
}

// Role-tagged union returned by GET /selection.
export type SelectionState =
  | { role: 'STUDENT'; groupInterest: InterestExpression[]; willingSupervisors: InterestExpression[]; selection: ProjectSelection | null }
  | { role: 'COORDINATOR'; selections: ProjectSelection[]; interestExpressions: InterestExpression[] }
  | { role: 'SUPERVISOR'; willingByMe: InterestExpression[]; pendingSelections: ProjectSelection[] };

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

export function useExpressInterest(cpiId: string) {
  return useSelectionAction(cpiId, (args: { ideaId: string; rank: number }) =>
    api.post(`/courses/${cpiId}/selection/interest`, args),
  );
}
export function useSeekingSupervisor(cpiId: string) {
  return useSelectionAction(cpiId, (ideaId: string) =>
    api.post(`/courses/${cpiId}/selection/seeking-supervisor`, { ideaId }),
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
