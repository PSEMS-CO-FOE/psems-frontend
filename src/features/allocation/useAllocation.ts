import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

interface AllocationEntry {
  id: string;
  group: { id: string; name: string };
  idea: { id: string; title: string; authorType: string };
  supervisor: { user: { email: string; fullName: string | null } } | null;
  source: 'FROM_SELECTION' | 'COORDINATOR_OVERRIDE';
}

export interface AllocationMap {
  finalized: boolean;
  allocations: AllocationEntry[];
  unmatchedGroups: { id: string; name: string }[];
}

function allocationKey(cpiId: string) {
  return ['allocation', cpiId] as const;
}

export function useAllocationMap(cpiId: string) {
  return useQuery({
    queryKey: allocationKey(cpiId),
    queryFn: async () => {
      const res = await api.get<AllocationMap>(`/courses/${cpiId}/allocations`);
      return res.data;
    },
  });
}

function useAllocationAction<TArgs>(cpiId: string, request: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: allocationKey(cpiId) }),
  });
}

export function useGenerateAllocations(cpiId: string) {
  return useAllocationAction(cpiId, () => api.post(`/courses/${cpiId}/allocations/generate`));
}

export function useOverrideAllocation(cpiId: string) {
  return useAllocationAction(cpiId, (args: { groupId: string; ideaId: string; supervisorUserId?: string }) =>
    api.put(`/courses/${cpiId}/allocations/${args.groupId}`, {
      ideaId: args.ideaId,
      supervisorUserId: args.supervisorUserId,
    }),
  );
}

export function useFinalizeAllocations(cpiId: string) {
  return useAllocationAction(cpiId, () => api.post(`/courses/${cpiId}/allocations/finalize`));
}
