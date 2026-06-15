import type { IDashboardRepository } from "@/domain/ports";
import type { ActivityDay, FeedItem, FeedPage, TokenStats, WorkspaceOverview } from "@/domain/entities";
import { apiFetch } from "./apiClient";

interface RawFeedItem {
  event_id: string;
  user_email: string;
  user_name: string;
  project_name: string | null;
  prompt_preview: string;
  status: string;
  created_at: string;
  branch: string | null;
  prompt_tokens: number | null;
  response_tokens: number | null;
  raw_response: string | null;
  diff: string | null;
  commit_hash: string | null;
  comment_count: number;
  frame: "A" | "B" | "C" | "D" | null;
  ai_contribution: number | null;
  decision_summary: string | null;
  decision_type: string | null;
  what_was_built: string | null;
  problem_solved: string | null;
  ai_role: string | null;
  event_type: string;
  pr_number: number | null;
  pr_url: string | null;
  github_author: string | null;
}

function mapFeedItem(i: RawFeedItem): FeedItem {
  return {
    eventId: i.event_id,
    userEmail: i.user_email,
    userName: i.user_name ?? "",
    projectName: i.project_name,
    promptPreview: i.prompt_preview,
    status: i.status as FeedItem["status"],
    createdAt: i.created_at,
    branch: i.branch,
    promptTokens: i.prompt_tokens,
    responseTokens: i.response_tokens,
    rawResponse: i.raw_response,
    diff: i.diff,
    commitHash: i.commit_hash,
    commentCount: i.comment_count,
    frame: i.frame,
    aiContribution: i.ai_contribution,
    decisionSummary: i.decision_summary,
    decisionType: i.decision_type,
    whatWasBuilt: i.what_was_built,
    problemSolved: i.problem_solved,
    aiRole: i.ai_role,
    eventType: i.event_type ?? "commit",
    prNumber: i.pr_number ?? null,
    prUrl: i.pr_url ?? null,
    githubAuthor: i.github_author ?? null,
  };
}

// LSP: IDashboardRepository의 완전한 구현체 — 인터페이스와 동일한 계약 보장
class DashboardApiRepository implements IDashboardRepository {
  constructor(private readonly token: string) {}

  async getOverview(workspaceId: string): Promise<WorkspaceOverview> {
    const data = await apiFetch<{
      member_count: number;
      project_count: number;
      events_today: number;
      events_week: number;
      events_total: number;
    }>(`/dashboard/${workspaceId}/overview`, this.token);

    return {
      memberCount: data.member_count,
      projectCount: data.project_count,
      eventsToday: data.events_today,
      eventsWeek: data.events_week,
      eventsTotal: data.events_total,
    };
  }

  async getFeed(workspaceId: string, limit: number, offset: number, branch?: string, dateFrom?: string): Promise<FeedPage> {
    const branchParam = branch ? `&branch=${encodeURIComponent(branch)}` : "";
    const dateParam = dateFrom ? `&date_from=${encodeURIComponent(dateFrom)}` : "";
    const data = await apiFetch<{
      items: Array<RawFeedItem>;
      total: number;
    }>(`/dashboard/${workspaceId}/feed?limit=${limit}&offset=${offset}${branchParam}${dateParam}`, this.token);

    return { items: data.items.map(mapFeedItem), total: data.total };
  }

  async getActivity(workspaceId: string, days: number): Promise<ActivityDay[]> {
    const data = await apiFetch<{ daily: Array<{ date: string; count: number }> }>(
      `/dashboard/${workspaceId}/activity?days=${days}`,
      this.token
    );
    return data.daily;
  }

  async searchEvents(workspaceId: string, query: string, limit = 20): Promise<FeedPage> {
    const data = await apiFetch<{
      items: Array<RawFeedItem>;
      total: number;
    }>(`/dashboard/${workspaceId}/search?q=${encodeURIComponent(query)}&limit=${limit}`, this.token);

    return { items: data.items.map(mapFeedItem), total: data.total };
  }

  async getBranches(workspaceId: string): Promise<string[]> {
    const data = await apiFetch<{ branches: string[] }>(
      `/dashboard/${workspaceId}/branches`,
      this.token
    );
    return data.branches;
  }

  async getTokenStats(workspaceId: string, days: number, branch?: string): Promise<TokenStats> {
    const branchParam = branch ? `&branch=${encodeURIComponent(branch)}` : "";
    const data = await apiFetch<{
      daily: Array<{
        date: string;
        prompt_tokens: number;
        response_tokens: number;
        total_tokens: number;
      }>;
      total_prompt: number;
      total_response: number;
    }>(`/dashboard/${workspaceId}/token-stats?days=${days}${branchParam}`, this.token);

    return {
      daily: data.daily.map((d) => ({
        date: d.date,
        promptTokens: d.prompt_tokens,
        responseTokens: d.response_tokens,
        totalTokens: d.total_tokens,
      })),
      totalPrompt: data.total_prompt,
      totalResponse: data.total_response,
    };
  }
}

// OCP: 팩토리 함수로 교체 가능 — 테스트 시 MockDashboardRepository로 스왑
export function createDashboardRepository(token: string): IDashboardRepository {
  return new DashboardApiRepository(token);
}
