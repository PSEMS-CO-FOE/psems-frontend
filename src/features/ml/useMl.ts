import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

// ML-backed draft assistance. Every hook degrades quietly: the ML service is an
// enhancement, so when it is unreachable the UI simply shows nothing.

export interface SupervisorSuggestion {
  lecturer_id: string;
  name: string;
  research_interests: string;
  match_percent: number;
}

export interface SimilarProject {
  idea_id: string;
  title: string | null;
  similarity: number;
  tier: 'high' | 'moderate' | 'low';
}

export interface SimilarityResult {
  flagged: boolean;
  tier: string;
  similar_projects: SimilarProject[];
}

export function useMlStatus() {
  return useQuery({
    queryKey: ['ml', 'status'],
    queryFn: async () => {
      const res = await api.get<{ enabled: boolean; reachable: boolean }>('/ml/status');
      return res.data;
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useSupervisorSuggestions() {
  return useMutation({
    mutationFn: async (input: { title: string; description: string; k?: number }) => {
      const res = await api.post<{ recommendations: SupervisorSuggestion[] }>(
        '/ml/supervisor-suggestions',
        input,
      );
      return res.data.recommendations;
    },
  });
}

export function useSimilarityPreview() {
  return useMutation({
    mutationFn: async (input: { title: string; description: string }) => {
      const res = await api.post<SimilarityResult>('/ml/similarity-preview', input);
      return res.data;
    },
  });
}

export interface ProposalAnalysis {
  proposal_id: string;
  title: string;
  sections_found: string[];
  missing_required: string[];
  keywords: { keyword: string; score: number; confidence: string }[];
  research_area: { primary_area: string; sub_area: string | null; confidence: number };
  technologies: { name: string; category: string }[];
  complexity: { complexity: string; reasons: string[] };
}

type AnalysisResponse =
  | { available: true; analysis: ProposalAnalysis }
  | { available: false; reason: string };

export function useProposalAnalysis() {
  return useMutation({
    mutationFn: async (input: { cpiId: string; submissionId: string }) => {
      const res = await api.post<AnalysisResponse>('/ml/proposal-analysis', input);
      return res.data;
    },
  });
}
