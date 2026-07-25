import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface SavedCriterion {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  maxScore: number;
}

export interface SavedStage {
  id: string;
  name: string;
  weight: number;
  evaluatorsRequired: number;
  submissionRequired: boolean;
  submissionWindowStart: string | null;
  submissionWindowEnd: string | null;
  executionWindowStart: string | null;
  executionWindowEnd: string | null;
  criteria: SavedCriterion[];
  evaluators: {
    cpiEvaluator: { lecturer: { user: { email: string; fullName: string | null } } };
  }[];
}

// Shape sent to PUT /config. Windows are optional ISO strings (both or neither).
export interface ConfigInputStage {
  name: string;
  weight: number;
  evaluatorsRequired: number;
  submissionRequired: boolean;
  submissionWindowStart?: string;
  submissionWindowEnd?: string;
  executionWindowStart?: string;
  executionWindowEnd?: string;
  criteria: { name: string; description?: string; weight: number; maxScore: number }[];
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
