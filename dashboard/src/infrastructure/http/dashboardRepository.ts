import type { IDashboardRepository } from "@/domain/ports";
import type { ActivityDay, AiTrend, AiTrendBucket, CacheSuggestion, CacheSuggestions, FeedItem, FeedPage, FrameStats, MemberFrameStats, TokenStats, WorkspaceOverview } from "@/domain/entities";
import { apiFetch } from "./apiClient";

export interface SmartSearchEvent {
  event_id: string;
  created_at: string;
  what_was_built: string | null;
  problem_solved: string | null;
  decision_type: string | null;
  frame: string | null;
  ai_contribution: number | null;
  project_name: string | null;
  branch: string | null;
  commit_hash: string | null;
}

export interface SmartSearchResult {
  query: string;
  synthesis: string;
  found: number;
  events: SmartSearchEvent[];
}

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
  tradeoffs: string | null;
  rejected_alternatives: string | null;
  implicit_constraints: string | null;
  event_type: string;
  pr_number: number | null;
  pr_url: string | null;
  github_author: string | null;
  source_type: string;
  validation_status: string | null;
  doc_path: string | null;
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
    tradeoffs: i.tradeoffs ?? null,
    rejectedAlternatives: i.rejected_alternatives ?? null,
    implicitConstraints: i.implicit_constraints ?? null,
    eventType: i.event_type ?? "commit",
    prNumber: i.pr_number ?? null,
    prUrl: i.pr_url ?? null,
    githubAuthor: i.github_author ?? null,
    sourceType: i.source_type ?? "commit",
    validationStatus: i.validation_status ?? null,
    docPath: i.doc_path ?? null,
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

  async getFeed(workspaceId: string, limit: number, offset: number, branch?: string, dateFrom?: string, frame?: string): Promise<FeedPage> {
    const branchParam = branch ? `&branch=${encodeURIComponent(branch)}` : "";
    const dateParam = dateFrom ? `&date_from=${encodeURIComponent(dateFrom)}` : "";
    const frameParam = frame ? `&frame=${encodeURIComponent(frame)}` : "";
    const data = await apiFetch<{
      items: Array<RawFeedItem>;
      total: number;
    }>(`/dashboard/${workspaceId}/feed?limit=${limit}&offset=${offset}${branchParam}${dateParam}${frameParam}`, this.token);

    return { items: data.items.map(mapFeedItem), total: data.total };
  }

  async getActivity(workspaceId: string, days: number): Promise<ActivityDay[]> {
    const data = await apiFetch<{ daily: Array<{ date: string; count: number }> }>(
      `/dashboard/${workspaceId}/activity?days=${days}`,
      this.token
    );
    return data.daily;
  }

  async suggestEvents(workspaceId: string, query: string): Promise<Array<{ text: string; decision_type: string | null }>> {
    const data = await apiFetch<{ items: Array<{ text: string; decision_type: string | null }> }>(
      `/dashboard/${workspaceId}/suggest?q=${encodeURIComponent(query)}`,
      this.token,
    );
    return data.items;
  }

  async smartSearch(workspaceId: string, query: string): Promise<SmartSearchResult> {
    return apiFetch<SmartSearchResult>(
      `/dashboard/${workspaceId}/smart-search?q=${encodeURIComponent(query)}`,
      this.token,
    );
  }

  async searchEvents(workspaceId: string, query: string, limit = 20): Promise<FeedPage> {
    const data = await apiFetch<{
      items: Array<RawFeedItem>;
      total: number;
    }>(`/dashboard/${workspaceId}/search?q=${encodeURIComponent(query)}&limit=${limit}`, this.token);

    return { items: data.items.map(mapFeedItem), total: data.total };
  }

  async exportContext(workspaceId: string, level: 1 | 2 | 3): Promise<string> {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const res = await fetch(`${API_BASE}/dashboard/${workspaceId}/export?level=${level}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    return res.text();
  }

  async getBranches(workspaceId: string): Promise<string[]> {
    const data = await apiFetch<{ branches: string[] }>(
      `/dashboard/${workspaceId}/branches`,
      this.token
    );
    return data.branches;
  }

  async getFrameStats(workspaceId: string, days: number): Promise<FrameStats> {
    const data = await apiFetch<{
      distribution: Record<string, number>;
      total: number;
      avg_ai_contribution: number;
      by_member: Array<{
        user_name: string;
        user_email: string;
        A: number; B: number; C: number; D: number;
        avg_ai: number; total: number;
      }>;
    }>(`/dashboard/${workspaceId}/frame-stats?days=${days}`, this.token);

    return {
      distribution: data.distribution,
      total: data.total,
      avgAiContribution: data.avg_ai_contribution,
      byMember: data.by_member.map((m): MemberFrameStats => ({
        userName: m.user_name,
        userEmail: m.user_email,
        A: m.A, B: m.B, C: m.C, D: m.D,
        avgAi: m.avg_ai,
        total: m.total,
      })),
    };
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

  async getAiTrend(workspaceId: string, period: string): Promise<AiTrend> {
    const data = await apiFetch<{
      period: string;
      buckets: Array<{
        bucket: string;
        avg_ai: number;
        total: number;
        frame_a: number;
        frame_b: number;
        frame_c: number;
        frame_d: number;
      }>;
      current_avg_ai: number;
      prev_avg_ai: number;
      delta_pct: number;
    }>(`/dashboard/${workspaceId}/ai-trend?period=${period}`, this.token);

    return {
      period: data.period,
      buckets: data.buckets.map((b): AiTrendBucket => ({
        bucket: b.bucket,
        avgAi: b.avg_ai,
        total: b.total,
        frameA: b.frame_a,
        frameB: b.frame_b,
        frameC: b.frame_c,
        frameD: b.frame_d,
      })),
      currentAvgAi: data.current_avg_ai,
      prevAvgAi: data.prev_avg_ai,
      deltaPct: data.delta_pct,
    };
  }

  async getCacheSuggestions(workspaceId: string): Promise<CacheSuggestions> {
    const data = await apiFetch<{
      suggestions: Array<{
        domain: string;
        count: number;
        priority: "HIGH" | "MED" | "LOW";
        action: string;
        example: string;
        suggestion_type: string;
      }>;
      total_events_analyzed: number;
      avg_prompt_tokens: number;
      high_token_alert: boolean;
    }>(`/dashboard/${workspaceId}/cache-suggestions`, this.token);

    return {
      suggestions: data.suggestions.map((s): CacheSuggestion => ({
        domain: s.domain,
        count: s.count,
        priority: s.priority,
        action: s.action,
        example: s.example,
        suggestionType: s.suggestion_type,
      })),
      totalEventsAnalyzed: data.total_events_analyzed,
      avgPromptTokens: data.avg_prompt_tokens,
      highTokenAlert: data.high_token_alert,
    };
  }

  async getPmBrief(workspaceId: string): Promise<PmBriefResult> {
    return apiFetch<PmBriefResult>(
      `/dashboard/${workspaceId}/pm-brief`,
      this.token,
      { method: "POST" },
    );
  }

  async chat(workspaceId: string, message: string, history: ChatHistoryItem[]): Promise<ChatResult> {
    return apiFetch<ChatResult>(
      `/dashboard/${workspaceId}/chat`,
      this.token,
      {
        method: "POST",
        body: JSON.stringify({ message, history }),
      },
    );
  }

  async listDocPending(workspaceId: string): Promise<DocItem[]> {
    const data = await apiFetch<{ items: DocItem[] }>(
      `/workspace/${workspaceId}/docs/pending`,
      this.token,
    );
    return data.items;
  }

  async reviewDoc(
    workspaceId: string,
    eventId: string,
    body: { validation_status: string; what_was_decided?: string; why?: string },
  ): Promise<void> {
    await apiFetch<{ ok: boolean }>(
      `/workspace/${workspaceId}/docs/${eventId}/review`,
      this.token,
      { method: "PATCH", body: JSON.stringify(body) },
    );
  }
}

export interface DocItem {
  event_id: string;
  doc_path: string;
  validation_status: string | null;
  created_at: string;
  what_was_decided: string | null;
  why: string | null;
  alternatives: string | null;
  constraints: string | null;
  validation_note: string | null;
  decision_type: string | null;
  status: string;
  section_content: string;
}

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResult {
  reply: string;
  sources: Array<{ id: string; what_was_built: string | null; created_at: string; frame: string | null }>;
}

export interface PmBriefResult {
  summary: string;
  patterns: Array<{ title: string; detail: string; severity: string }>;
  stale_tradeoffs: Array<{ decision: string; made_at: string; note: string }>;
  blind_spots: string[];
  next_focus: { title: string; rationale: string };
  event_count: number;
}

// OCP: 팩토리 함수로 교체 가능 — 테스트 시 MockDashboardRepository로 스왑
export function createDashboardRepository(token: string): IDashboardRepository & {
  getPmBrief(workspaceId: string): Promise<PmBriefResult>;
  chat(workspaceId: string, message: string, history: ChatHistoryItem[]): Promise<ChatResult>;
  exportContext(workspaceId: string, level: 1 | 2 | 3): Promise<string>;
  listDocPending(workspaceId: string): Promise<DocItem[]>;
  reviewDoc(workspaceId: string, eventId: string, body: { validation_status: string; what_was_decided?: string; why?: string }): Promise<void>;
} {
  return new DashboardApiRepository(token);
}
