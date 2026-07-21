import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export type IdeaAuthorType = 'COORDINATOR' | 'SUPERVISOR' | 'STUDENT';
export type IdeaApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | null;

export interface Idea {
  id: string;
  title: string;
  description: string;
  authorType: IdeaAuthorType;
  visibility: 'PUBLIC_TO_STUDENTS' | 'GROUP_RESTRICTED';
  approvalStatus: IdeaApprovalStatus;
  groupId: string | null;
  createdAt: string;
  author: { email: string; fullName: string | null };
  group: { id: string; name: string } | null;
}

function ideasKey(cpiId: string) {
  return ['ideas', cpiId] as const;
}

export function useIdeas(cpiId: string) {
  return useQuery({
    queryKey: ideasKey(cpiId),
    queryFn: async () => {
      const res = await api.get<Idea[]>(`/courses/${cpiId}/ideas`);
      return res.data;
    },
  });
}

export function usePostIdea(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { title: string; description: string }) => {
      const res = await api.post<Idea>(`/courses/${cpiId}/ideas`, args);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ideasKey(cpiId) }),
  });
}

export function useDecideIdea(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { ideaId: string; decision: 'approve' | 'reject' }) => {
      const res = await api.post(`/courses/${cpiId}/ideas/${args.ideaId}/${args.decision}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ideasKey(cpiId) }),
  });
}
