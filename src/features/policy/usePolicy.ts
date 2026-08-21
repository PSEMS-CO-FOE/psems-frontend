import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { cpiDetailKey } from '@/features/courses/useCpiDetail';
import type { CpiMode } from '@/features/courses/types';

export type SelectionConfirmer = 'SUPERVISOR' | 'COORDINATOR' | 'EITHER';
export type AvailabilityRequirement = 'EVALUATORS_ONLY' | 'EVALUATORS_AND_SUPERVISORS' | 'NONE';

// Every behavioural rule for a course. What used to be decided by its mode.
export interface CpiPolicy {
  allowStudentIdeas: boolean;
  studentIdeasLeaderOnly: boolean;
  allowSupervisorIdeas: boolean;
  allowCoordinatorIdeas: boolean;
  allowLecturerIdeas: boolean;
  requireStudentIdeaApproval: boolean;
  maxIdeasPerGroup: number | null;
  allowCoSupervisorOnIdea: boolean;

  interestEnabled: boolean;
  maxInterestsPerGroup: number | null;
  allowInterestWithdrawal: boolean;
  allowLecturerInterestInGroupIdeas: boolean;
  allowCoSupervisionInterest: boolean;
  studentsSeeOtherGroupIdeas: boolean;
  allowSupervisorSelfRequest: boolean;
  selectionConfirmedBy: SelectionConfirmer;

  allowIndividualParticipation: boolean;
  autoCreateSoloGroup: boolean;

  headJudgeEnabled: boolean;
  requireOverallComment: boolean;
  availabilityRequiredFrom: AvailabilityRequirement;

  gradingEnabled: boolean;
  caContributionPercent: number | null;
}

export function policyKey(cpiId: string) {
  return ['policy', cpiId] as const;
}

export function useCpiPolicy(cpiId: string) {
  return useQuery({
    queryKey: policyKey(cpiId),
    queryFn: async () => {
      const res = await api.get<CpiPolicy>(`/courses/${cpiId}/policy`);
      return res.data;
    },
  });
}

export function useUpdateCpiPolicy(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (changes: Partial<CpiPolicy>) => {
      const res = await api.patch<CpiPolicy>(`/courses/${cpiId}/policy`, changes);
      return res.data;
    },
    // Policy drives what every other screen allows, so invalidate broadly.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKey(cpiId) });
      queryClient.invalidateQueries({ queryKey: ['evaluationConfig', cpiId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', cpiId] });
    },
  });
}

/**
 * A preset is a starting point, not a mode the course is locked into: applying
 * one writes the five settings it has an opinion about and leaves every other
 * one as the coordinator left it. It changes the course's mode label too, so
 * the course detail has to be refetched alongside the policy.
 */
export function useApplyPreset(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mode: Exclude<CpiMode, null>) => {
      await api.post(`/courses/${cpiId}/preset`, { mode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKey(cpiId) });
      queryClient.invalidateQueries({ queryKey: cpiDetailKey(cpiId) });
    },
  });
}

/** The settings each preset writes — shown to the coordinator before they
 *  apply one, so nothing changes without being named first. */
export const PRESET_EFFECTS: Record<Exclude<CpiMode, null>, string[]> = {
  SUPERVISOR_LED: [
    'Supervisors post ideas',
    'The coordinator does not',
    'Student ideas need no approval',
    'Interest is used',
    'The chosen supervisor confirms a selection',
  ],
  COORDINATOR_MANAGED: [
    'The coordinator posts ideas',
    'Supervisors do not',
    'Student ideas need approval',
    'Interest is turned off',
    'The coordinator confirms a selection',
  ],
};
