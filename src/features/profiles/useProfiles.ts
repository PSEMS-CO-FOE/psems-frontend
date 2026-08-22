import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export type ResearchOutputKind = 'PUBLICATION' | 'PROJECT' | 'GRANT' | 'OTHER';

export interface ResearchOutput {
  id?: string;
  title: string;
  venue?: string | null;
  year?: number | null;
  url?: string | null;
  kind: ResearchOutputKind;
}

export interface UserProfile {
  id: string;
  userId: string;
  headline: string | null;
  about: string | null;
  department: string | null;
  designation: string | null;
  contactEmail: string | null;
  links: Record<string, string> | null;
  interests: { id: string; area: string }[];
  outputs: (ResearchOutput & { id: string })[];
  user: { id: string; email: string; fullName: string | null; role: string };
}

// Projects supervised are derived from allocations, never stored, so this can
// never drift from what actually happened.
export interface SupervisedProject {
  title: string;
  course: string;
  academicYear: string;
  projectType: string;
  groupName: string;
  students: { studentId: string; fullName: string | null }[];
}

// What a student did, as opposed to what a lecturer supervised. Also derived
// from allocations rather than stored.
export interface OwnProject {
  title: string;
  course: string;
  academicYear: string;
  projectType: string;
  groupName: string;
  supervisor: { id: string; fullName: string | null; email: string } | null;
}

export interface ProfileView {
  profile: UserProfile | null;
  user: { id: string; email: string; fullName: string | null; role: string };
  supervisedProjects: SupervisedProject[];
  ownProjects: OwnProject[];
}

export interface ProfileUpdate {
  headline?: string | null;
  about?: string | null;
  department?: string | null;
  designation?: string | null;
  contactEmail?: string | null;
  interests?: string[];
  outputs?: ResearchOutput[];
}

const profileKey = (userId: string) => ['profile', userId] as const;

export function useProfile(userId: string, enabled = true) {
  return useQuery({
    queryKey: profileKey(userId),
    enabled: enabled && Boolean(userId),
    queryFn: async () => {
      const res = await api.get<ProfileView>(`/profiles/${userId}`);
      return res.data;
    },
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const res = await api.get<ProfileView>('/profiles/me');
      return res.data;
    },
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProfileUpdate) => {
      const res = await api.patch<ProfileView>('/profiles/me', input);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      if (data.user.id) queryClient.invalidateQueries({ queryKey: profileKey(data.user.id) });
    },
  });
}

// Filtering by research area is the reason interests are tagged rather than
// left as prose in the About section.
export function useProfileSearch(query: { area?: string; department?: string; q?: string }, enabled = true) {
  return useQuery({
    queryKey: ['profileSearch', query],
    enabled,
    queryFn: async () => {
      const res = await api.get<UserProfile[]>('/profiles/search', { params: query });
      return res.data;
    },
  });
}

export function useResearchAreas() {
  return useQuery({
    queryKey: ['researchAreas'],
    queryFn: async () => {
      const res = await api.get<{ area: string; count: number }[]>('/profiles/areas');
      return res.data;
    },
  });
}
