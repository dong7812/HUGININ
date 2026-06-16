import type { ActivityDay, AiTrend, CacheSuggestions, Comment, FeedPage, FrameStats, TokenStats, WorkspaceOverview } from "./entities";

export interface IDashboardRepository {
  getOverview(workspaceId: string): Promise<WorkspaceOverview>;
  getFeed(workspaceId: string, limit: number, offset: number, branch?: string, dateFrom?: string): Promise<FeedPage>;
  getActivity(workspaceId: string, days: number): Promise<ActivityDay[]>;
  getBranches(workspaceId: string): Promise<string[]>;
  getTokenStats(workspaceId: string, days: number, branch?: string): Promise<TokenStats>;
  getFrameStats(workspaceId: string, days: number): Promise<FrameStats>;
  suggestEvents(workspaceId: string, query: string): Promise<Array<{ text: string; decision_type: string | null }>>;
  searchEvents(workspaceId: string, query: string, limit?: number): Promise<FeedPage>;
  getAiTrend(workspaceId: string, period: string): Promise<AiTrend>;
  getCacheSuggestions(workspaceId: string): Promise<CacheSuggestions>;
}

export interface ICommentRepository {
  listComments(eventId: string, workspaceId: string): Promise<Comment[]>;
  addComment(eventId: string, workspaceId: string, content: string): Promise<Comment>;
}

export interface IAuthRepository {
  login(email: string, password: string): Promise<string>;
}
