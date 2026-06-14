import type { ActivityDay, Comment, FeedPage, TokenStats, WorkspaceOverview } from "./entities";

export interface IDashboardRepository {
  getOverview(workspaceId: string): Promise<WorkspaceOverview>;
  getFeed(workspaceId: string, limit: number, offset: number, branch?: string, dateFrom?: string): Promise<FeedPage>;
  getActivity(workspaceId: string, days: number): Promise<ActivityDay[]>;
  getBranches(workspaceId: string): Promise<string[]>;
  getTokenStats(workspaceId: string, days: number, branch?: string): Promise<TokenStats>;
  searchEvents(workspaceId: string, query: string, limit?: number): Promise<FeedPage>;
}

export interface ICommentRepository {
  listComments(eventId: string, workspaceId: string): Promise<Comment[]>;
  addComment(eventId: string, workspaceId: string, content: string): Promise<Comment>;
}

export interface IAuthRepository {
  login(email: string, password: string): Promise<string>;
}
