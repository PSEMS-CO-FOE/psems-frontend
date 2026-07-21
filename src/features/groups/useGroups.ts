import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

type MemberStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface GroupMember {
  id: string;
  status: MemberStatus;
  student: {
    id: string;
    studentId: string;
    user: { email: string; fullName: string | null };
  };
}

export interface Group {
  id: string;
  name: string;
  leaderStudentId: string;
  members: GroupMember[];
}

export interface MyGroupResponse {
  group: Group | null;
  locked: boolean;
}

function myGroupKey(cpiId: string) {
  return ['groups', 'mine', cpiId] as const;
}

export function useMyGroup(cpiId: string) {
  return useQuery({
    queryKey: myGroupKey(cpiId),
    queryFn: async () => {
      const res = await api.get<MyGroupResponse>(`/courses/${cpiId}/groups/mine`);
      return res.data;
    },
  });
}

export function useCreateGroup(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post<Group>(`/courses/${cpiId}/groups`, { name });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myGroupKey(cpiId) }),
  });
}

export function useInviteMember(cpiId: string, groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post(`/courses/${cpiId}/groups/${groupId}/invite`, { email });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myGroupKey(cpiId) }),
  });
}

export function useRespondGroupInvite(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { groupId: string; decision: 'ACCEPT' | 'DECLINE' }) => {
      const res = await api.post(`/courses/${cpiId}/groups/${args.groupId}/respond`, {
        decision: args.decision,
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myGroupKey(cpiId) }),
  });
}
