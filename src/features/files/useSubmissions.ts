import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface Submission {
  id: string;
  fileName: string;
  fileSize: number;
  isLate: boolean;
  submittedAt: string;
  stage: { id: string; name: string };
  group?: { id: string; name: string };
}

function submissionsKey(cpiId: string) {
  return ['submissions', cpiId] as const;
}

export function useSubmissions(cpiId: string) {
  return useQuery({
    queryKey: submissionsKey(cpiId),
    queryFn: async () => {
      const res = await api.get<Submission[]>(`/courses/${cpiId}/submissions`);
      return res.data;
    },
  });
}

export function useSubmitProposal(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { stageId: string; file: File }) => {
      const form = new FormData();
      form.append('file', args.file);
      const res = await api.post<Submission>(
        `/courses/${cpiId}/stages/${args.stageId}/submission`,
        form,
      );
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: submissionsKey(cpiId) }),
  });
}
