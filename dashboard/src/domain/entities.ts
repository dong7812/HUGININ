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
  userName: string;
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
  // ETL 분석 결과
  frame: "A" | "B" | "C" | "D" | null;
  aiContribution: number | null;  // 0.0–1.0
  decisionSummary: string | null;
  decisionType: string | null;
  // 풍부한 서사 필드
  whatWasBuilt: string | null;
  problemSolved: string | null;
  aiRole: string | null;
  tradeoffs: string | null;
  rejectedAlternatives: string | null;
  implicitConstraints: string | null;
  // GitHub PR 이벤트
  eventType: string;
  prNumber: number | null;
  prUrl: string | null;
  githubAuthor: string | null;
  // 문서 임포트
  sourceType: string;
  validationStatus: string | null;
  docPath: string | null;
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

export interface MemberFrameStats {
  userName: string;
  userEmail: string;
  A: number;
  B: number;
  C: number;
  D: number;
  avgAi: number;
  total: number;
}

export interface FrameStats {
  distribution: Record<string, number>;
  total: number;
  avgAiContribution: number;
  byMember: MemberFrameStats[];
}

export interface User {
  email: string;
  token: string;
}

export interface AiTrendBucket {
  bucket: string;  // ISO datetime
  avgAi: number;
  total: number;
  frameA: number;
  frameB: number;
  frameC: number;
  frameD: number;
}

export interface AiTrend {
  period: string;
  buckets: AiTrendBucket[];
  currentAvgAi: number;
  prevAvgAi: number;
  deltaPct: number;  // 이전 기간 대비 % 변화
}

export interface CacheSuggestion {
  domain: string;
  count: number;
  priority: "HIGH" | "MED" | "LOW";
  action: string;
  example: string;
  suggestionType: string;
}

export interface CacheSuggestions {
  suggestions: CacheSuggestion[];
  totalEventsAnalyzed: number;
  avgPromptTokens: number;
  highTokenAlert: boolean;
}
