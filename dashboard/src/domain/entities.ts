export interface WorkspaceOverview {
  memberCount: number;
  projectCount: number;
  eventsToday: number;
  eventsWeek: number;
  eventsTotal: number;
}

export interface FeedItem {
  eventId: string;
  userEmail: string;
  projectName: string | null;
  promptPreview: string;
  status: "pending" | "refined" | "failed";
  createdAt: string;
  branch: string | null;
  promptTokens: number | null;
  responseTokens: number | null;
  rawResponse: string | null;
  diff: string | null;
  commitHash: string | null;
  commentCount: number;
}

export interface Comment {
  commentId: string;
  userEmail: string;
  content: string;
  createdAt: string;
}

export interface TokenDay {
  date: string;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
}

export interface TokenStats {
  daily: TokenDay[];
  totalPrompt: number;
  totalResponse: number;
}

export interface FeedPage {
  items: FeedItem[];
  total: number;
}

export interface ActivityDay {
  date: string;
  count: number;
}

export interface User {
  email: string;
  token: string;
}
