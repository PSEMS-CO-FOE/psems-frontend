import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { cpiDetailKey } from './useCpiDetail';

// All four assignment actions share the same shape (post a lecturerUserId, or
// nothing, then refetch the CPI detail), so a small factory keeps them uniform.
function useCpiAction<TArgs>(
  cpiId: string,
  request: (args: TArgs) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cpiDetailKey(cpiId) });
    },
  });
}

export function useInviteSupervisor(cpiId: string) {
  return useCpiAction(cpiId, (lecturerUserId: string) =>
    api.post(`/courses/${cpiId}/supervisors`, { lecturerUserId }),
  );
}

export function useAssignEvaluator(cpiId: string) {
  return useCpiAction(cpiId, (lecturerUserId: string) =>
    api.post(`/courses/${cpiId}/evaluators`, { lecturerUserId }),
  );
}

export function useSetHeadJudge(cpiId: string) {
  return useCpiAction(cpiId, (lecturerUserId: string) =>
    api.post(`/courses/${cpiId}/head-judge`, { lecturerUserId }),
  );
}

export function useFinalizeCoordinatorManaged(cpiId: string) {
  return useCpiAction(cpiId, () =>
    api.post(`/courses/${cpiId}/coordinator-managed-preset`),
  );
}
