"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDashboardRepository } from "@/infrastructure/http/dashboardRepository";
import { createCommentRepository } from "@/infrastructure/http/commentRepository";
import { useAuthStore } from "@/application/stores/authStore";

import { apiFetch } from "@/infrastructure/http/apiClient";

// TanStack Query: 서버 상태 전담 — 캐싱·refetch·loading 상태 관리
// ISP: 각 훅은 필요한 데이터만 노출

interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
}

export function useWorkspacesQuery() {
  const token = useAuthStore((s) => s.token) ?? "";
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: () => apiFetch<WorkspaceSummary[]>("/workspace", token),
    enabled: !!token,
    staleTime: 60_000,
  });
}

export function useOverviewQuery(workspaceId: string) {
  const token = useAuthStore((s) => s.token) ?? "";
  const repo = createDashboardRepository(token);
  return useQuery({
    queryKey: ["overview", workspaceId],
    queryFn: () => repo.getOverview(workspaceId),
    enabled: !!token && !!workspaceId,
    staleTime: 30_000,
  });
}

export function useFeedQuery(workspaceId: string, page = 0, limit = 15, branch?: string, dateFrom?: string, frame?: string) {
  const token = useAuthStore((s) => s.token) ?? "";
  const repo = createDashboardRepository(token);
  return useQuery({
    queryKey: ["feed", workspaceId, page, branch, dateFrom, frame],
    queryFn: () => repo.getFeed(workspaceId, limit, page * limit, branch, dateFrom, frame),
    enabled: !!token && !!workspaceId,
    staleTime: 15_000,
  });
}

export function useSmartSearchQuery(workspaceId: string, query: string) {
  const token = useAuthStore((s) => s.token) ?? "";
  const repo = createDashboardRepository(token);
  return useQuery({
    queryKey: ["smart-search", workspaceId, query],
    queryFn: () => repo.smartSearch(workspaceId, query),
    enabled: !!token && !!workspaceId && query.trim().length >= 2,
    staleTime: 60_000,
  });
}

export function useSuggestQuery(workspaceId: string, query: string) {
  const token = useAuthStore((s) => s.token) ?? "";
  const repo = createDashboardRepository(token);
  return useQuery({
    queryKey: ["suggest", workspaceId, query],
    queryFn: () => repo.suggestEvents(workspaceId, query),
    enabled: !!token && !!workspaceId && query.trim().length >= 1,
    staleTime: 10_000,
  });
}

export function useSearchQuery(workspaceId: string, query: string) {
  const token = useAuthStore((s) => s.token) ?? "";
  const repo = createDashboardRepository(token);
  return useQuery({
    queryKey: ["search", workspaceId, query],
    queryFn: () => repo.searchEvents(workspaceId, query),
    enabled: !!token && !!workspaceId && query.trim().length >= 2,
    staleTime: 30_000,
  });
}

export function useActivityQuery(workspaceId: string, days = 30) {
  const token = useAuthStore((s) => s.token) ?? "";
  const repo = createDashboardRepository(token);
  return useQuery({
    queryKey: ["activity", workspaceId, days],
    queryFn: () => repo.getActivity(workspaceId, days),
    enabled: !!token && !!workspaceId,
    staleTime: 60_000,
  });
}

export function useBranchesQuery(workspaceId: string) {
  const token = useAuthStore((s) => s.token) ?? "";
  const repo = createDashboardRepository(token);
  return useQuery({
    queryKey: ["branches", workspaceId],
    queryFn: () => repo.getBranches(workspaceId),
    enabled: !!token && !!workspaceId,
    staleTime: 30_000,
  });
}

export function useFrameStatsQuery(workspaceId: string, days = 30) {
  const token = useAuthStore((s) => s.token) ?? "";
  const repo = createDashboardRepository(token);
  return useQuery({
    queryKey: ["frameStats", workspaceId, days],
    queryFn: () => repo.getFrameStats(workspaceId, days),
    enabled: !!token && !!workspaceId,
    staleTime: 60_000,
  });
}

export function useTokenStatsQuery(workspaceId: string, days = 30, branch?: string) {
  const token = useAuthStore((s) => s.token) ?? "";
  const repo = createDashboardRepository(token);
  return useQuery({
    queryKey: ["tokenStats", workspaceId, days, branch],
    queryFn: () => repo.getTokenStats(workspaceId, days, branch),
    enabled: !!token && !!workspaceId,
    staleTime: 60_000,
  });
}

export function useCommentsQuery(eventId: string, workspaceId: string, enabled = false) {
  const token = useAuthStore((s) => s.token) ?? "";
  const repo = createCommentRepository(token);
  return useQuery({
    queryKey: ["comments", eventId],
    queryFn: () => repo.listComments(eventId, workspaceId),
    enabled: !!token && enabled,
    staleTime: 10_000,
  });
}

export function useAiTrendQuery(workspaceId: string, period: string) {
  const token = useAuthStore((s) => s.token) ?? "";
  const repo = createDashboardRepository(token);
  return useQuery({
    queryKey: ["aiTrend", workspaceId, period],
    queryFn: () => repo.getAiTrend(workspaceId, period),
    enabled: !!token && !!workspaceId,
    staleTime: 60_000,
  });
}

export function useCacheSuggestionsQuery(workspaceId: string) {
  const token = useAuthStore((s) => s.token) ?? "";
  const repo = createDashboardRepository(token);
  return useQuery({
    queryKey: ["cacheSuggestions", workspaceId],
    queryFn: () => repo.getCacheSuggestions(workspaceId),
    enabled: !!token && !!workspaceId,
    staleTime: 300_000,  // 5분 — 자주 바뀌지 않음
  });
}

export function usePmBriefMutation(workspaceId: string) {
  const token = useAuthStore((s) => s.token) ?? "";
  const repo = createDashboardRepository(token);
  return useMutation({
    mutationFn: () => repo.getPmBrief(workspaceId),
  });
}

export function useAddCommentMutation(eventId: string, workspaceId: string) {
  const token = useAuthStore((s) => s.token) ?? "";
  const repo = createCommentRepository(token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => repo.addComment(eventId, workspaceId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", eventId] });
    },
  });
}
