import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface BulkProvisionResult {
  batchId: string;
  created: number;
  skipped: { row: number; email: string; reason: string }[];
  invalid: { row: number; issues: string[] }[];
}

export interface BatchStatus {
  batchId: string;
  total: number;
  sent: number;
  failed: number;
  queued: number;
  students: {
    email: string;
    deliveryStatus: 'QUEUED' | 'SENT' | 'FAILED';
    failureReason: string | null;
    dispatchedAt: string | null;
  }[];
}

export function useBulkProvision() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file); // field name must be 'file'
      const res = await api.post<BulkProvisionResult>('/students/bulk-provision', form);
      return res.data;
    },
  });
}

export function useBatchStatus(batchId: string | null) {
  return useQuery({
    queryKey: ['provisioning', batchId],
    enabled: !!batchId,
    queryFn: async () => {
      const res = await api.get<BatchStatus>(`/students/provisioning/${batchId}`);
      return res.data;
    },
    // Poll every 3s while emails are in flight; stop once none are queued.
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && data.queued > 0 ? 3000 : false;
    },
    // Keep polling even when the tab is hidden, so status reaches a final state.
    refetchIntervalInBackground: true,
  });
}
