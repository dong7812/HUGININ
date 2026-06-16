"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  GitCommit,
  GitBranch,
  GitPullRequest,
  GitMerge,
  User,
  Folder,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Copy,
  Check,
  Terminal,
  Code2,
  Search,
  X,
  ExternalLink,
} from "lucide-react";
import { useFeedQuery, useBranchesQuery, useSearchQuery, useSuggestQuery, useSmartSearchQuery } from "@/application/queries/dashboardQueries";
import type { SmartSearchEvent } from "@/infrastructure/http/dashboardRepository";
import { CommentSection } from "./CommentSection";
import type { FeedItem } from "@/domain/entities";

interface Props {
  workspaceId: string;
  dateFrom?: string;
  submittedQuery: string;
  onSearch: (q: string) => void;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "수집됨",
  refined: "정제됨",
  failed: "실패",
};

const FRAME_LABEL: Record<string, string> = {
  A: "Human-led",
  B: "AI-assisted",
  C: "AI-led",
  D: "Automated",
};

const FRAME_COLOR: Record<string, string> = {
  A: "text-sky-600 bg-sky-50 border-sky-200",
  B: "text-violet-600 bg-violet-50 border-violet-200",
  C: "text-emerald-600 bg-emerald-50 border-emerald-200",
  D: "text-orange-600 bg-orange-50 border-orange-200",
};

const FRAME_BAR: Record<string, string> = {
  A: "bg-sky-400",
  B: "bg-violet-500",
  C: "bg-emerald-500",
  D: "bg-orange-400",
};

const DECISION_TYPE_LABEL: Record<string, string> = {
  feature: "기능",
  bugfix: "버그픽스",
  refactor: "리팩터",
  config: "설정",
  docs: "문서",
  test: "테스트",
  other: "기타",
};

const LANE_COLORS = [
  "#7c3aed", // violet
  "#059669", // emerald
  "#2563eb", // blue
  "#ea580c", // orange
  "#db2777", // pink
  "#ca8a04", // yellow
  "#0891b2", // cyan
  "#dc2626", // red
];

const LANE_W = 16;
const DOT_TOP = 20;
const DOT_R = 4;

interface GraphRowMeta {
  lane: number;
  activeLanes: number[];
  isFirstInPage: boolean;
  isLastInPage: boolean;
}

function computeGraphLayout(items: FeedItem[]): GraphRowMeta[] {
  const firstSeen = new Map<string, number>();
  const lastSeen = new Map<string, number>();

  items.forEach((item, i) => {
    const b = item.branch ?? "main";
    if (!firstSeen.has(b)) firstSeen.set(b, i);
    lastSeen.set(b, i);
  });

  const laneMap = new Map<string, number>();
  let nextLane = 0;
  items.forEach((item) => {
    const b = item.branch ?? "main";
    if (!laneMap.has(b)) laneMap.set(b, nextLane++);
  });

  return items.map((item, i) => {
    const branch = item.branch ?? "main";
    const lane = laneMap.get(branch)!;

    const activeLanes: number[] = [];
    laneMap.forEach((l, b) => {
      if ((firstSeen.get(b) ?? 0) <= i && (lastSeen.get(b) ?? 0) >= i) {
        activeLanes.push(l);
      }
    });
    activeLanes.sort((a, b) => a - b);

    return {
      lane,
      activeLanes,
      isFirstInPage: firstSeen.get(branch) === i,
      isLastInPage: lastSeen.get(branch) === i,
    };
  });
}

function GraphCell({ meta, isLastOverall }: { meta: GraphRowMeta; isLastOverall: boolean }) {
  const maxLane = meta.activeLanes.length > 0 ? Math.max(...meta.activeLanes) : 0;
  const width = (maxLane + 1) * LANE_W + 8;

  return (
    <div className="relative self-stretch shrink-0" style={{ width }}>
      {meta.activeLanes.map((laneIdx) => {
        const color = LANE_COLORS[laneIdx % LANE_COLORS.length];
        const cx = laneIdx * LANE_W + LANE_W / 2 + 4;
        const isMyLane = laneIdx === meta.lane;

        const showTopLine = isMyLane ? !meta.isFirstInPage : true;
        const showBottomLine = isMyLane
          ? !meta.isLastInPage && !isLastOverall
          : !isLastOverall;

        return (
          <div key={laneIdx} className="absolute inset-0 pointer-events-none">
            {showTopLine && (
              <div
                className="absolute"
                style={{ left: cx - 0.5, top: 0, height: DOT_TOP - DOT_R, width: 1, backgroundColor: color, opacity: 0.35 }}
              />
            )}
            {showBottomLine && (
              <div
                className="absolute"
                style={{ left: cx - 0.5, top: DOT_TOP + DOT_R, bottom: 0, width: 1, backgroundColor: color, opacity: 0.35 }}
              />
            )}
            {isMyLane && (
              <div
                className="absolute z-10 rounded-full"
                style={{
                  left: cx - DOT_R,
                  top: DOT_TOP - DOT_R,
                  width: DOT_R * 2,
                  height: DOT_R * 2,
                  backgroundColor: color,
                  boxShadow: "0 0 0 2px #fff",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatK(n: number | null) {
  if (n === null) return null;
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function DiffView({ diff }: { diff: string }) {
  const lines = diff.split("\n");
  return (
    <pre className="text-[11px] leading-5 overflow-x-auto font-mono whitespace-pre bg-slate-50 p-3 rounded-lg">
      {lines.map((line, i) => {
        let cls = "text-slate-400";
        if (line.startsWith("+++") || line.startsWith("---")) cls = "text-slate-500";
        else if (line.startsWith("+")) cls = "text-emerald-600";
        else if (line.startsWith("-")) cls = "text-red-500";
        else if (line.startsWith("@@")) cls = "text-violet-600";
        return (
          <span key={i} className={`block ${cls}`}>
            {line || " "}
          </span>
        );
      })}
    </pre>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={copy} className="p-0.5 rounded text-slate-400 hover:text-slate-700 transition-colors">
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
    </button>
  );
}

export function DecisionTimeline({ workspaceId, dateFrom, submittedQuery, onSearch }: Props) {
  const [page, setPage] = useState(0);
  const [branch, setBranch] = useState<string | undefined>(undefined);
  const [inputValue, setInputValue] = useState(submittedQuery);
  const [debouncedInput, setDebouncedInput] = useState(submittedQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const limit = 15;

  useEffect(() => {
    if (!submittedQuery) setInputValue("");
  }, [submittedQuery]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedInput(inputValue), 250);
    return () => clearTimeout(t);
  }, [inputValue]);

  const isSearching = submittedQuery.trim().length >= 2;

  const feedResult = useFeedQuery(workspaceId, page, limit, branch, dateFrom);
  const searchResult = useSearchQuery(workspaceId, submittedQuery);
  const smartResult = useSmartSearchQuery(workspaceId, submittedQuery);
  const { data: suggestions } = useSuggestQuery(workspaceId, debouncedInput);
  const { data: branches } = useBranchesQuery(workspaceId);

  const { data, isLoading } = isSearching ? searchResult : feedResult;
  const totalPages = !isSearching && data ? Math.ceil(data.total / limit) : 0;

  const items = data?.items ?? [];
  const graphLayout = useMemo(() => computeGraphLayout(items), [items]);

  function handleBranchChange(value: string) {
    setBranch(value === "" ? undefined : value);
    setPage(0);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-0 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-4">
            <div className="w-2 h-2 rounded-full bg-slate-100 animate-pulse mt-2 shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-48 bg-slate-100 rounded-lg animate-pulse mb-2" />
              <div className="h-3 w-32 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">AI 결정 타임라인</span>
            <span className="text-xs text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded-md">
              {data?.total ?? 0}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isSearching && branches && branches.length > 0 && (
              <div className="flex items-center gap-1.5">
                <GitBranch size={12} className="text-slate-400" />
                <select
                  value={branch ?? ""}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none focus:border-violet-400 appearance-none cursor-pointer"
                >
                  <option value="">모든 브랜치</option>
                  {branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {!isSearching && totalPages > 1 && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1 rounded-md disabled:opacity-30 hover:bg-slate-100 transition-colors text-slate-500"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-slate-400 px-1 font-mono">{page + 1}/{totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="p-1 rounded-md disabled:opacity-30 hover:bg-slate-100 transition-colors text-slate-500"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { onSearch(inputValue); setShowSuggestions(false); }
              if (e.key === "Escape") { setShowSuggestions(false); inputRef.current?.blur(); }
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="검색어 입력 후 Enter..."
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:bg-white transition-all"
          />
          {inputValue && (
            <button
              onClick={() => { setInputValue(""); setDebouncedInput(""); onSearch(""); setShowSuggestions(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={13} />
            </button>
          )}

          {/* 제안 드롭다운 */}
          {showSuggestions && suggestions && suggestions.length > 0 && inputValue.trim().length >= 1 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setInputValue(s.text); onSearch(s.text); setShowSuggestions(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0"
                >
                  <Search size={11} className="shrink-0 text-slate-400" />
                  <span className="flex-1 text-sm text-slate-700 truncate">{s.text}</span>
                  {s.decision_type && (
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                      {s.decision_type}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Smart Search 패널 */}
      {isSearching && (
        <SmartSearchPanel
          query={submittedQuery}
          synthesis={smartResult.data?.synthesis}
          events={smartResult.data?.events ?? []}
          isLoading={smartResult.isLoading}
        />
      )}

      {items.length === 0 && !isSearching ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <GitCommit size={32} className="opacity-30" />
          <p className="text-sm font-medium">아직 수집된 AI 결정이 없습니다</p>
          <p className="text-xs text-slate-400">
            Git Hook 또는 MCP를 통해 Claude Code를 사용하면 자동 수집됩니다
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {items.map((item, idx) => (
            <TimelineEntry
              key={item.eventId}
              item={item}
              workspaceId={workspaceId}
              graphMeta={graphLayout[idx]}
              isLast={idx === items.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PrCard({ item, graphMeta, isLast }: { item: FeedItem; graphMeta: GraphRowMeta; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(item.createdAt);
  const dateStr = date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  const timeStr = date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const laneColor = LANE_COLORS[graphMeta.lane % LANE_COLORS.length];

  const isMerged = item.eventType === "pr_merged";
  const isClosed = item.eventType === "pr_closed";
  const PrIcon = isMerged ? GitMerge : GitPullRequest;
  const prColor = isMerged ? "text-violet-600" : isClosed ? "text-red-500" : "text-emerald-600";
  const prBg = isMerged
    ? "bg-violet-50 border-violet-200 text-violet-700"
    : isClosed
    ? "bg-red-50 border-red-200 text-red-600"
    : "bg-emerald-50 border-emerald-200 text-emerald-700";
  const prLabel = isMerged ? "merged" : isClosed ? "closed" : "opened";

  const author = item.githubAuthor || item.userName || item.userEmail.split("@")[0];

  return (
    <div className={`flex group hover:bg-slate-50 transition-colors ${!isLast ? "border-b border-slate-100" : ""}`}>
      <GraphCell meta={graphMeta} isLastOverall={isLast} />
      <div className="flex-1 py-3 pr-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 flex items-start gap-2">
            <PrIcon size={14} className={`${prColor} shrink-0 mt-0.5`} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-mono font-semibold ${prBg}`}>
                  PR #{item.prNumber} · {prLabel}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">@{author}</span>
              </div>
              <p className="text-sm text-slate-800 leading-snug font-medium line-clamp-1">
                {item.whatWasBuilt || item.promptPreview.replace(/^#\d+:\s*/, "")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 p-1 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors mt-0.5"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        <div className="flex items-center gap-2 mt-1.5 ml-6 flex-wrap">
          {item.frame && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-mono font-medium ${FRAME_COLOR[item.frame]}`}>
              {item.frame} · {FRAME_LABEL[item.frame]}
            </span>
          )}
          {item.branch && (
            <span
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-mono"
              style={{ backgroundColor: `${laneColor}15`, color: laneColor, border: `1px solid ${laneColor}30` }}
            >
              <GitBranch size={9} />
              {item.branch}
            </span>
          )}
          {item.prUrl && (
            <a
              href={item.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-violet-600 transition-colors"
            >
              <ExternalLink size={9} />
              GitHub
            </a>
          )}
          <span className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
            <Clock size={10} />
            {dateStr} {timeStr}
          </span>
        </div>

        {expanded && item.aiRole && (
          <div className="mt-3 ml-6 bg-violet-50 border border-violet-100 rounded-xl overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-violet-100">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              <span className="text-[10px] text-violet-600 font-semibold uppercase tracking-wider">PR 분석</span>
            </div>
            <div className="px-3 py-2.5">
              <p className="text-xs text-slate-700 leading-relaxed">{item.aiRole}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineEntry({
  item,
  workspaceId,
  graphMeta,
  isLast,
}: {
  item: FeedItem;
  workspaceId: string;
  graphMeta: GraphRowMeta;
  isLast: boolean;
}) {
  const isPr = item.eventType?.startsWith("pr_");
  if (isPr) {
    return <PrCard item={item} graphMeta={graphMeta} isLast={isLast} />;
  }

  const [expanded, setExpanded] = useState(false);
  const [responseExpanded, setResponseExpanded] = useState(false);
  const [diffExpanded, setDiffExpanded] = useState(false);

  const date = new Date(item.createdAt);
  const dateStr = date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  const timeStr = date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  const promptK = formatK(item.promptTokens);
  const responseK = formatK(item.responseTokens);
  const shortHash = item.commitHash ? item.commitHash.slice(0, 7) : null;

  const responsePreview = item.rawResponse ? item.rawResponse.slice(0, 300) : null;
  const responseHasMore = item.rawResponse && item.rawResponse.length > 300;

  const laneColor = LANE_COLORS[graphMeta.lane % LANE_COLORS.length];

  const titleText = item.whatWasBuilt || item.decisionSummary || item.promptPreview;
  const titleClass = item.whatWasBuilt || item.decisionSummary
    ? "text-sm text-slate-800 font-medium leading-snug line-clamp-1"
    : "text-sm text-slate-400 leading-snug line-clamp-1 font-mono";

  return (
    <div className={`flex group hover:bg-slate-50 transition-colors ${!isLast ? "border-b border-slate-100" : ""}`}>
      <GraphCell meta={graphMeta} isLastOverall={isLast} />

      <div className="flex-1 py-3 pr-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <p className={titleClass}>{titleText}</p>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 p-1 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors mt-0.5"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Compact meta row */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {item.frame && (
            <>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-mono font-medium ${FRAME_COLOR[item.frame]}`}>
                {item.frame} · {FRAME_LABEL[item.frame]}
              </span>
              {item.aiContribution !== null && (
                <div className="flex items-center gap-1 max-w-[100px]">
                  <div className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${FRAME_BAR[item.frame]}`}
                      style={{ width: `${Math.round((item.aiContribution ?? 0) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {Math.round((item.aiContribution ?? 0) * 100)}%
                  </span>
                </div>
              )}
            </>
          )}

          {!item.frame && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                item.status === "refined"
                  ? "bg-emerald-50 text-emerald-600"
                  : item.status === "failed"
                  ? "bg-red-50 text-red-500"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {STATUS_LABEL[item.status] ?? item.status}
            </span>
          )}

          {item.branch && (
            <span
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-mono"
              style={{ backgroundColor: `${laneColor}15`, color: laneColor, border: `1px solid ${laneColor}30` }}
            >
              <GitBranch size={9} />
              {item.branch}
            </span>
          )}

          {item.decisionType && DECISION_TYPE_LABEL[item.decisionType] && (
            <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded-md">
              {DECISION_TYPE_LABEL[item.decisionType]}
            </span>
          )}

          {(promptK || responseK) && (
            <span className="flex items-center gap-0.5 text-[10px] font-mono">
              {promptK && <span className="text-violet-500">{promptK}p</span>}
              {responseK && <span className="text-emerald-600">{responseK}r</span>}
            </span>
          )}

          {item.commentCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <MessageSquare size={10} />
              {item.commentCount}
            </span>
          )}

          <span className="flex items-center gap-1 text-[11px] text-slate-400 ml-auto">
            <Clock size={10} />
            {dateStr} {timeStr}
          </span>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-3 flex flex-col gap-2.5">
            {/* 맥락 */}
            {item.problemSolved && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider shrink-0 w-5 mt-0.5">왜</span>
                <p className="text-xs text-slate-600 leading-relaxed">{item.problemSolved}</p>
              </div>
            )}

            {/* AI 협업 분석 */}
            {(item.whatWasBuilt || item.aiRole) && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    <span className="text-[10px] text-violet-600 font-semibold uppercase tracking-wider">AI 협업 분석</span>
                  </div>
                  {item.userName && (
                    <span className="text-[10px] text-slate-400 font-mono">{item.userName}</span>
                  )}
                </div>

                <div className="flex flex-col divide-y divide-slate-100">
                  {item.whatWasBuilt && (
                    <div className="px-3 py-2.5 flex gap-2.5">
                      <span className="text-[10px] text-violet-500 font-semibold uppercase tracking-wider shrink-0 w-6 pt-0.5">무엇</span>
                      <p className="text-xs text-slate-700 leading-relaxed">{item.whatWasBuilt}</p>
                    </div>
                  )}
                  {item.aiRole && (
                    <div className="px-3 py-2.5 flex gap-2.5">
                      <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider shrink-0 w-6 pt-0.5">AI</span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.userName ? item.aiRole.replace(/인간/g, item.userName) : item.aiRole}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prompt */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
                <Terminal size={11} className="text-violet-500" />
                <span className="text-[11px] text-slate-500 font-mono">prompt</span>
                <div className="ml-auto">
                  <CopyButton text={item.promptPreview} />
                </div>
              </div>
              <div className="px-3 py-2.5">
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-mono">
                  {item.promptPreview}
                </p>
              </div>
            </div>

            {responsePreview && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
                  <Code2 size={11} className="text-emerald-600" />
                  <span className="text-[11px] text-slate-500 font-mono">response</span>
                  <div className="ml-auto">
                    <CopyButton text={item.rawResponse!} />
                  </div>
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-mono">
                    {responseExpanded ? item.rawResponse : responsePreview}
                    {responseHasMore && !responseExpanded && (
                      <span className="text-slate-400">…</span>
                    )}
                  </p>
                  {responseHasMore && (
                    <button
                      onClick={() => setResponseExpanded((v) => !v)}
                      className="mt-1.5 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {responseExpanded ? "접기" : `더 보기 (${item.rawResponse!.length}자)`}
                    </button>
                  )}
                </div>
              </div>
            )}

            {item.diff && (
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <div
                  role="button"
                  className="w-full flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => setDiffExpanded((v) => !v)}
                >
                  <GitCommit size={11} className="text-blue-500" />
                  <span className="text-[11px] text-slate-500 font-mono">diff</span>
                  {shortHash && (
                    <span className="text-[10px] font-mono text-slate-400 ml-1">{shortHash}</span>
                  )}
                  <div className="ml-auto flex items-center gap-1.5">
                    <CopyButton text={item.diff} />
                    {diffExpanded ? <ChevronUp size={11} className="text-slate-400" /> : <ChevronDown size={11} className="text-slate-400" />}
                  </div>
                </div>
                {diffExpanded && (
                  <div className="px-3 py-2.5 max-h-80 overflow-y-auto">
                    <DiffView diff={item.diff} />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              {item.commitHash && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">commit</span>
                  <span className="text-[10px] text-slate-600 font-mono">{item.commitHash}</span>
                  <CopyButton text={item.commitHash} />
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono">user</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <User size={10} />
                  {item.userEmail.split("@")[0]}
                </span>
              </div>
              {item.projectName && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Folder size={10} />
                  {item.projectName}
                </div>
              )}
            </div>

            <CommentSection eventId={item.eventId} workspaceId={workspaceId} />
          </div>
        )}
      </div>
    </div>
  );
}

const SS_TYPE_COLOR: Record<string, string> = {
  feature: "text-violet-600",
  bugfix: "text-red-500",
  refactor: "text-amber-600",
  config: "text-slate-500",
  docs: "text-blue-500",
  test: "text-emerald-600",
  other: "text-slate-400",
};

function SmartSearchPanel({
  query, synthesis, events, isLoading,
}: {
  query: string;
  synthesis?: string;
  events: SmartSearchEvent[];
  isLoading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const COLLAPSE_CHARS = 200;
  const isLong = (synthesis?.length ?? 0) > COLLAPSE_CHARS;
  const displayText = isLong && !expanded
    ? synthesis!.slice(0, COLLAPSE_CHARS).trimEnd() + "…"
    : synthesis;

  if (isLoading) {
    return (
      <div className="mx-4 mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs text-violet-500 font-medium">관련 결정 분석 중...</span>
        </div>
        <div className="h-3 w-3/4 bg-violet-100 rounded-lg animate-pulse" />
        <div className="h-3 w-full bg-violet-100 rounded-lg animate-pulse" />
        <div className="h-3 w-2/3 bg-violet-100 rounded-lg animate-pulse" />
      </div>
    );
  }
  if (!synthesis && events.length === 0) return null;

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-violet-100 bg-violet-50 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-violet-100">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
        <span className="text-xs font-semibold text-violet-700">AI 분석</span>
        <span className="text-xs text-slate-500 ml-1">"{query}"</span>
        <span className="ml-auto text-[10px] text-slate-400 font-mono">{events.length}개 결정</span>
      </div>

      {/* LLM 합성 텍스트 */}
      {synthesis && (
        <div className="px-4 py-3 border-b border-violet-100">
          <p className="text-sm text-slate-700 leading-relaxed">{displayText}</p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium transition-colors"
            >
              {expanded ? "접기" : "더보기"}
            </button>
          )}
        </div>
      )}

      {/* 관련 이벤트 카드 */}
      {events.length > 0 && (
        <div className="flex flex-col divide-y divide-violet-100">
          {events.map((ev, i) => (
            <div key={ev.event_id} className="flex gap-3 px-4 py-3 hover:bg-white/60 transition-colors">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-[10px] font-mono text-violet-600 shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(ev.created_at).toLocaleDateString("ko-KR")}
                  </span>
                  {ev.decision_type && (
                    <span className={`text-[10px] font-mono font-medium ${SS_TYPE_COLOR[ev.decision_type] ?? "text-slate-400"}`}>
                      {ev.decision_type}
                    </span>
                  )}
                  {ev.frame && (
                    <span className="text-[10px] text-slate-400">
                      {{ A: "Human-led", B: "AI-assisted", C: "AI-led", D: "Automated" }[ev.frame]}
                    </span>
                  )}
                  {ev.project_name && (
                    <span className="text-[10px] text-slate-400 truncate">{ev.project_name}</span>
                  )}
                </div>
                {ev.what_was_built && (
                  <p className="text-xs text-slate-700 font-medium mb-0.5 line-clamp-1">{ev.what_was_built}</p>
                )}
                {ev.problem_solved && (
                  <p className="text-[11px] text-slate-500 line-clamp-1">{ev.problem_solved}</p>
                )}
              </div>
              {ev.ai_contribution != null && (
                <div className="shrink-0">
                  <span className="text-[10px] font-mono text-slate-400">
                    AI {Math.round(ev.ai_contribution * 100)}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
