import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

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

function policyKey(cpiId: string) {
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
