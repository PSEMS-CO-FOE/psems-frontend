import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import type { MarkCounting, PanelRole, StagePanelRule } from '@/features/panel/usePanel';

export type PanelScoreVisibility = 'ISOLATED' | 'OPEN_WITH_NAMES' | 'OPEN_ANONYMOUS';
export type CriterionLevel = 'GROUP' | 'INDIVIDUAL';

export interface SavedCriterion {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  maxScore: number;
  level: CriterionLevel;
}

export interface SavedStage {
  id: string;
  name: string;
  weight: number;
  submissionRequired: boolean;
  submissionWindowStart: string | null;
  submissionWindowEnd: string | null;
  executionWindowStart: string | null;
  executionWindowEnd: string | null;
  panelScoreVisibility: PanelScoreVisibility;
  pooledSharePercent: number | null;
  pooledScorerLimit: number | null;
  panelRules: StagePanelRule[];
  criteria: SavedCriterion[];
  evaluators: {
    cpiEvaluator: { lecturer: { user: { email: string; fullName: string | null } } };
  }[];
}

// Shape sent to PUT /config. Windows are optional ISO strings (both or neither).
export interface ConfigInputPanelRule {
  role: PanelRole;
  minRequired: number;
  maxAllowed?: number | null;
  weightPercent?: number | null;
  markCounting?: MarkCounting;
  openToAll?: boolean;
}

export interface ConfigInputStage {
  name: string;
  weight: number;
  submissionRequired: boolean;
  submissionWindowStart?: string;
  submissionWindowEnd?: string;
  executionWindowStart?: string;
  executionWindowEnd?: string;
  panelScoreVisibility?: PanelScoreVisibility;
  panelRules?: ConfigInputPanelRule[];
  criteria: { name: string; description?: string; weight: number; maxScore: number; level?: CriterionLevel }[];
}

function configKey(cpiId: string) {
  return ['evaluationConfig', cpiId] as const;
}

export function useEvaluationConfig(cpiId: string) {
  return useQuery({
    queryKey: configKey(cpiId),
    queryFn: async () => {
      const res = await api.get<SavedStage[]>(`/courses/${cpiId}/evaluations/config`);
      return res.data;
    },
  });
}

export function useSetEvaluationConfig(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (stages: ConfigInputStage[]) => {
      const res = await api.put<SavedStage[]>(`/courses/${cpiId}/evaluations/config`, { stages });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: configKey(cpiId) }),
  });
}

export function useAssignStageEvaluator(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { stageId: string; lecturerUserId: string }) => {
      const res = await api.post(`/courses/${cpiId}/evaluations/stages/${args.stageId}/evaluators`, {
        lecturerUserId: args.lecturerUserId,
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: configKey(cpiId) }),
  });
}

// Targeted edits that stay available after submissions exist — a coordinator
// still needs to fix a window, open a stage, or restaff a panel on the day.
export function usePatchStage(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { stageId: string; changes: Partial<Pick<SavedStage, 'name' | 'panelScoreVisibility'>> }) => {
      const res = await api.patch<SavedStage>(`/courses/${cpiId}/evaluations/stages/${args.stageId}`, args.changes);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: configKey(cpiId) }),
  });
}

export function useSetPanelRules(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { stageId: string; rules: ConfigInputPanelRule[] }) => {
      const res = await api.put<StagePanelRule[]>(
        `/courses/${cpiId}/evaluations/stages/${args.stageId}/panel-rules`,
        { rules: args.rules },
      );
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: configKey(cpiId) }),
  });
}

// Weighting pooled marks is decided with the scores visible, so the reason is
// mandatory and kept as an audit record.
export function useSetPooledShare(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { stageId: string; sharePercent: number; scorerLimit?: number | null; reason: string }) => {
      const { stageId, ...body } = args;
      const res = await api.post<SavedStage>(`/courses/${cpiId}/evaluations/stages/${stageId}/pooled-share`, body);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: configKey(cpiId) }),
  });
}
