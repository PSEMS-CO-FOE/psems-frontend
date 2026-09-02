import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface StageBreakdown {
  stageId: string;
  stageName: string;
  weight: number;
  stageScorePercent: number;
  weightedContribution: number;
}

export interface StudentBreakdown extends StageBreakdown {
  groupComponentPercent: number;
  // Null when the stage has no per-student criteria, so everyone in the group
  // scored the same.
  individualComponentPercent: number | null;
}

export interface StudentMarks {
  studentId: string;
  indexNumber: string;
  name: string;
  stages: StudentBreakdown[];
  // Null when the course releases the grade but not the marks behind it.
  overall: number | null;
  grade: string | null;
  contributionToModule: number | null;
}

export interface GroupMarks {
  groupId: string;
  groupName: string;
  stages: StageBreakdown[];
  // Null when the course releases the grade but not the marks behind it.
  overall: number | null;
  grade: string | null;
  contributionToModule: number | null;
  students: StudentMarks[];
}

export interface MarksView {
  gradingEnabled: boolean;
  // False when this assessment is only one component of a module: the marks
  // still count, but the module's letter grade is decided elsewhere.
  gradeIsForWholeModule: boolean;
  gradesReleased: boolean;
  // False when a grade has been released without the figures behind it.
  marksReleased: boolean;
  caContributionPercent: number | null;
  // Stages a student cannot see yet. Named rather than hidden, so it is clear
  // something is still to come.
  pendingStages: { stageId: string; stageName: string }[];
  groups: GroupMarks[];
}

export interface MarkPublication {
  id: string;
  evaluationStageId: string | null;
  publishMarks: boolean;
  publishComments: boolean;
  publishGrades: boolean;
  publishedAt: string | null;
  stage: { id: string; name: string } | null;
}

export interface GradeBand {
  id: string;
  label: string;
  minPercent: number;
  orderIndex: number;
}

export interface MarkSheet {
  courseName: string;
  academicYear: string;
  gradingEnabled: boolean;
  // Null when the course has no pass mark. Coordinator-facing only.
  passMarkPercent: number | null;
  caContributionPercent: number | null;
  stages: { id: string; name: string; weight: number }[];
  // Fractions summing to 1.00, matching the printed sheet's weight row.
  weights: Record<string, number>;
  rows: {
    indexNumber: string;
    registrationNumber: string | null;
    surname: string;
    initials: string;
    name: string;
    groupName: string;
    stagePercents: Record<string, number | null>;
    total: number;
    grade: string | null;
    zeroTotal: boolean;
    belowPassMark: boolean;
  }[];
  flagged: number;
  belowPassMark: number;
}

function marksKey(cpiId: string) {
  return ['marks', cpiId] as const;
}

// The coordinator sees every group. A student sees their own group, and only
// the stages that have been published.
export function useMarks(cpiId: string) {
  return useQuery({
    queryKey: marksKey(cpiId),
    queryFn: async () => {
      const res = await api.get<MarksView>(`/courses/${cpiId}/marks`);
      return res.data;
    },
  });
}

export function useAggregateMarks(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<MarksView>(`/courses/${cpiId}/marks/aggregate`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: marksKey(cpiId) }),
  });
}

export function usePublications(cpiId: string) {
  return useQuery({
    queryKey: [...marksKey(cpiId), 'publications'],
    queryFn: async () => {
      const res = await api.get<MarkPublication[]>(`/courses/${cpiId}/marks/publications`);
      return res.data;
    },
  });
}

// stageId null sets the whole course; a stage id sets that stage only. Marks and
// comments are separate, and either can be turned off again.
export function useSetPublication(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      stageId: string | null;
      publishMarks: boolean;
      publishComments: boolean;
      publishGrades: boolean;
    }) => {
      const res = await api.post<MarkPublication[]>(`/courses/${cpiId}/marks/publish`, args);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: marksKey(cpiId) }),
  });
}

export function useGradeBands(cpiId: string) {
  return useQuery({
    queryKey: [...marksKey(cpiId), 'grade-bands'],
    queryFn: async () => {
      const res = await api.get<GradeBand[]>(`/courses/${cpiId}/marks/grade-bands`);
      return res.data;
    },
  });
}

export function useSetGradeBands(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bands: { label: string; minPercent: number }[]) => {
      const res = await api.put<GradeBand[]>(`/courses/${cpiId}/marks/grade-bands`, { bands });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: marksKey(cpiId) }),
  });
}

// Change the credit split after submissions exist, until marks are aggregated.
export function useSetStageWeights(cpiId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (weights: { stageId: string; weight: number }[]) => {
      const res = await api.put(`/courses/${cpiId}/evaluations/stage-weights`, { weights });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluationConfig', cpiId] });
      queryClient.invalidateQueries({ queryKey: marksKey(cpiId) });
    },
  });
}

export function useMarkSheet(cpiId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...marksKey(cpiId), 'sheet'],
    enabled,
    queryFn: async () => {
      const res = await api.get<MarkSheet>(`/courses/${cpiId}/marks/sheet`);
      return res.data;
    },
  });
}
