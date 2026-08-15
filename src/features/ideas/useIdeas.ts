import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export type IdeaAuthorType = 'COORDINATOR' | 'SUPERVISOR' | 'STUDENT';
export type IdeaApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED' | null;

export interface Idea {
  id: string;
  title: string;
  description: string;
  authorType: IdeaAuthorType;
  visibility: 'PUBLIC_TO_STUDENTS' | 'GROUP_RESTRICTED';
  approvalStatus: IdeaApprovalStatus;
  revisionNote: string | null;
  groupId: string | null;
  createdAt: string;
  author: { id?: string; email: string; fullName: string | null };
  group: { id: string; name: string } | null;
  // Primary supervisor plus any co-supervisor, so a group can see who they
  // would actually be working with — and who has yet to accept.
  supervisors?: IdeaSupervisor[];
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

export function useUpdateIdea(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { ideaId: string; title: string; description: string }) => {
      const res = await api.patch(`/courses/${cpiId}/ideas/${args.ideaId}`, {
        title: args.title,
        description: args.description,
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ideasKey(cpiId) }),
  });
}

export function useRequestIdeaRevision(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { ideaId: string; note: string }) => {
      const res = await api.post(`/courses/${cpiId}/ideas/${args.ideaId}/request-revision`, {
        note: args.note,
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ideasKey(cpiId) }),
  });
}

export interface IdeaSupervisorRow {
  id: string;
  isPrimary: boolean;
  invitationStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  lecturer: { id: string; user: { id: string; email: string; fullName: string | null } };
}

export type IdeaSupervisor = IdeaSupervisorRow;

// Naming a co-supervisor invites them — a group only ever sees who has actually
// agreed to take them on.
export function useAddCoSupervisor(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { ideaId: string; lecturerUserId: string }) => {
      const res = await api.post(`/courses/${cpiId}/ideas/${args.ideaId}/co-supervisors`, {
        lecturerUserId: args.lecturerUserId,
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideas', cpiId] }),
  });
}

export function useRespondCoSupervisor(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { ideaId: string; decision: 'ACCEPT' | 'DECLINE' }) => {
      const res = await api.post(`/courses/${cpiId}/ideas/${args.ideaId}/co-supervisors/respond`, {
        decision: args.decision,
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideas', cpiId] }),
  });
}

export function useRemoveCoSupervisor(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { ideaId: string; coSupervisorId: string }) => {
      const res = await api.delete(`/courses/${cpiId}/ideas/${args.ideaId}/co-supervisors/${args.coSupervisorId}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideas', cpiId] }),
  });
}
