"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  GitCommit,
  GitBranch,
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
} from "lucide-react";
import { useFeedQuery, useBranchesQuery, useSearchQuery } from "@/application/queries/dashboardQueries";
import { CommentSection } from "./CommentSection";
import type { FeedItem } from "@/domain/entities";

interface Props {
  workspaceId: string;
  dateFrom?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

const STATUS_DOT: Record<string, string> = {
  pending: "bg-yellow-400",
  refined: "bg-green-400",
  failed: "bg-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "수집됨",
  refined: "정제됨",
  failed: "실패",
};

// Frame A/B/C/D — AI 협업 수준
const FRAME_LABEL: Record<string, string> = {
  A: "Human-led",
  B: "AI-assisted",
  C: "AI-led",
  D: "Automated",
};
const FRAME_COLOR: Record<string, string> = {
  A: "text-sky-400 bg-sky-900/30 border-sky-700/40",
  B: "text-violet-400 bg-violet-900/30 border-violet-700/40",
  C: "text-emerald-400 bg-emerald-900/30 border-emerald-700/40",
  D: "text-orange-400 bg-orange-900/30 border-orange-700/40",
};
const FRAME_BAR: Record<string, string> = {
  A: "bg-sky-500",
  B: "bg-violet-500",
  C: "bg-emerald-500",
  D: "bg-orange-500",
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

// 브랜치 레인 색상 — 순서대로 할당
const LANE_COLORS = [
  "#a78bfa", // violet  (main/기본)
  "#34d399", // emerald
  "#60a5fa", // blue
  "#fb923c", // orange
  "#f472b6", // pink
  "#facc15", // yellow
  "#22d3ee", // cyan
  "#f87171", // red
];

const LANE_W = 16;   // 레인 1개 너비(px)
const DOT_TOP = 20;  // 행 상단에서 dot 중심까지(px) — collapsed 기준 첫 줄 중앙
const DOT_R = 4.5;   // dot 반지름(px)

interface GraphRowMeta {
  lane: number;
  activeLanes: number[];
  isFirstInPage: boolean; // 이 페이지에서 이 브랜치의 첫 등장
  isLastInPage: boolean;  // 이 페이지에서 이 브랜치의 마지막 등장
}

function computeGraphLayout(items: FeedItem[]): GraphRowMeta[] {
  const firstSeen = new Map<string, number>();
  const lastSeen = new Map<string, number>();

  items.forEach((item, i) => {
    const b = item.branch ?? "main";
    if (!firstSeen.has(b)) firstSeen.set(b, i);
    lastSeen.set(b, i);
  });

  // 첫 등장 순서대로 레인 할당 (main 계열이 왼쪽)
  const laneMap = new Map<string, number>();
  let nextLane = 0;
  items.forEach((item) => {
    const b = item.branch ?? "main";
    if (!laneMap.has(b)) laneMap.set(b, nextLane++);
  });

  return items.map((item, i) => {
    const branch = item.branch ?? "main";
    const lane = laneMap.get(branch)!;

    // 이 행에서 활성 레인: firstSeen <= i <= lastSeen 인 브랜치들
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

// 브랜치 그래프 셀 — 각 행의 왼쪽 레인 영역
function GraphCell({
  meta,
  isLastOverall,
}: {
  meta: GraphRowMeta;
  isLastOverall: boolean;
}) {
  const maxLane = meta.activeLanes.length > 0 ? Math.max(...meta.activeLanes) : 0;
  const width = (maxLane + 1) * LANE_W + 8;

  return (
    <div className="relative self-stretch shrink-0" style={{ width }}>
      {meta.activeLanes.map((laneIdx) => {
        const color = LANE_COLORS[laneIdx % LANE_COLORS.length];
        const cx = laneIdx * LANE_W + LANE_W / 2 + 4; // 레인 중심 x
        const isMyLane = laneIdx === meta.lane;

        const showTopLine = isMyLane ? !meta.isFirstInPage : true;
        const showBottomLine = isMyLane
          ? !meta.isLastInPage && !isLastOverall
          : !isLastOverall;

        return (
          <div key={laneIdx} className="absolute inset-0 pointer-events-none">
            {/* 위쪽 선: row top → dot top */}
            {showTopLine && (
              <div
                className="absolute"
                style={{
                  left: cx - 0.5,
                  top: 0,
                  height: DOT_TOP - DOT_R,
                  width: 1,
                  backgroundColor: color,
                  opacity: 0.55,
                }}
              />
            )}
            {/* 아래쪽 선: dot bottom → row bottom (expanded 시 자동 늘어남) */}
            {showBottomLine && (
              <div
                className="absolute"
                style={{
                  left: cx - 0.5,
                  top: DOT_TOP + DOT_R,
                  bottom: 0,
                  width: 1,
                  backgroundColor: color,
                  opacity: 0.55,
                }}
              />
            )}
            {/* commit dot */}
            {isMyLane && (
              <div
                className="absolute z-10 rounded-full"
                style={{
                  left: cx - DOT_R,
                  top: DOT_TOP - DOT_R,
                  width: DOT_R * 2,
                  height: DOT_R * 2,
                  backgroundColor: color,
                  boxShadow: "0 0 0 2px #09090b",
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
    <pre className="text-[11px] leading-5 overflow-x-auto font-mono whitespace-pre">
      {lines.map((line, i) => {
        let cls = "text-zinc-500";
        if (line.startsWith("+++") || line.startsWith("---")) cls = "text-zinc-400";
        else if (line.startsWith("+")) cls = "text-emerald-400";
        else if (line.startsWith("-")) cls = "text-red-400";
        else if (line.startsWith("@@")) cls = "text-violet-400";
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
    <button
      onClick={copy}
      className="p-0.5 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
    >
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
    </button>
  );
}

export function DecisionTimeline({ workspaceId, dateFrom, searchQuery = "", onSearchChange }: Props) {
  const [page, setPage] = useState(0);
  const [branch, setBranch] = useState<string | undefined>(undefined);
  const limit = 15;
  const isSearching = searchQuery.trim().length >= 2;

  const feedResult = useFeedQuery(workspaceId, page, limit, branch, dateFrom);
  const searchResult = useSearchQuery(workspaceId, searchQuery);
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
      <div className="flex flex-col gap-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3">
            <div className="flex flex-col items-center gap-1 w-6 shrink-0">
              <div className="w-3 h-3 rounded-full bg-zinc-800 animate-pulse mt-1" />
              <div className="w-px flex-1 bg-zinc-800" />
            </div>
            <div className="flex-1 pb-3">
              <div className="h-4 w-48 bg-zinc-800 rounded animate-pulse mb-2" />
              <div className="h-3 w-full bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GitCommit size={15} className="text-violet-400" />
            <span className="text-sm font-medium text-zinc-200">AI 결정 타임라인</span>
            {isSearching ? (
              <span className="text-xs text-zinc-500 font-mono">{data?.total ?? 0}건</span>
            ) : (
              <span className="text-xs text-zinc-500 font-mono">({data?.total ?? 0})</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isSearching && branches && branches.length > 0 && (
              <div className="flex items-center gap-1.5">
                <GitBranch size={12} className="text-zinc-500" />
                <select
                  value={branch ?? ""}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-zinc-500 appearance-none cursor-pointer"
                >
                  <option value="">모든 브랜치</option>
                  {branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {!isSearching && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1 rounded disabled:opacity-30 hover:bg-zinc-800 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-zinc-500 px-1">{page + 1}/{totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="p-1 rounded disabled:opacity-30 hover:bg-zinc-800 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {onSearchChange && (
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="prompt, response 전문 검색..."
              className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded-md pl-8 pr-8 py-1.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
          <GitCommit size={32} className="opacity-30" />
          <p className="text-sm">아직 수집된 AI 결정이 없습니다</p>
          <p className="text-xs text-zinc-600">
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

  return (
    <div className="flex group hover:bg-zinc-900/50 transition-colors">
      {/* 브랜치 그래프 */}
      <GraphCell meta={graphMeta} isLastOverall={isLast} />

      {/* Content */}
      <div className={`flex-1 py-3 pr-4 ${!isLast ? "border-b border-zinc-800/50" : ""}`}>
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* decision_summary가 있으면 우선 표시, 없으면 raw prompt preview */}
            {item.decisionSummary ? (
              <p className="text-sm text-zinc-100 leading-snug line-clamp-2">
                {item.decisionSummary}
              </p>
            ) : (
              <p className="text-sm text-zinc-400 leading-snug line-clamp-2 font-mono">
                {item.promptPreview}
              </p>
            )}
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 p-0.5 text-zinc-600 hover:text-zinc-300 transition-colors mt-0.5"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Frame + AI contribution bar */}
        {item.frame && (
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-medium ${FRAME_COLOR[item.frame]}`}>
              {item.frame} · {FRAME_LABEL[item.frame]}
            </span>
            {item.aiContribution !== null && (
              <div className="flex items-center gap-1.5 flex-1 max-w-[140px]">
                <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${FRAME_BAR[item.frame]}`}
                    style={{ width: `${Math.round((item.aiContribution ?? 0) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                  AI {Math.round((item.aiContribution ?? 0) * 100)}%
                </span>
              </div>
            )}
            {item.decisionType && DECISION_TYPE_LABEL[item.decisionType] && (
              <span className="text-[10px] text-zinc-500 font-mono">
                {DECISION_TYPE_LABEL[item.decisionType]}
              </span>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
          {!item.frame && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-mono ${
                item.status === "refined"
                  ? "bg-green-900/40 text-green-400"
                  : item.status === "failed"
                  ? "bg-red-900/40 text-red-400"
                  : "bg-yellow-900/40 text-yellow-400"
              }`}
            >
              {STATUS_LABEL[item.status] ?? item.status}
            </span>
          )}

          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
            <User size={10} />
            {item.userEmail.split("@")[0]}
          </span>

          {item.projectName && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
              <Folder size={10} />
              {item.projectName}
            </span>
          )}

          {item.branch && (
            <span
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{
                backgroundColor: `${laneColor}18`,
                color: laneColor,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: `${laneColor}40`,
              }}
            >
              <GitBranch size={9} />
              {item.branch}
            </span>
          )}

          {shortHash && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 rounded">
              <GitCommit size={9} />
              {shortHash}
            </span>
          )}

          {(promptK || responseK) && (
            <span className="flex items-center gap-1 text-[10px] font-mono">
              {promptK && <span className="text-violet-500">{promptK}p</span>}
              {responseK && <span className="text-emerald-600">{responseK}r</span>}
            </span>
          )}

          {item.commentCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-zinc-500">
              <MessageSquare size={10} />
              {item.commentCount}
            </span>
          )}

          <span className="flex items-center gap-1 text-[11px] text-zinc-600 ml-auto">
            <Clock size={10} />
            {dateStr} {timeStr}
          </span>
        </div> {/* end meta row */}

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-3 flex flex-col gap-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-800/40">
                <Terminal size={11} className="text-violet-400" />
                <span className="text-[11px] text-zinc-400 font-mono">prompt</span>
                <div className="ml-auto flex items-center gap-1">
                  <CopyButton text={item.promptPreview} />
                </div>
              </div>
              <div className="px-3 py-2.5">
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">
                  {item.promptPreview}
                </p>
              </div>
            </div>

            {responsePreview && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-800/40">
                  <Code2 size={11} className="text-emerald-400" />
                  <span className="text-[11px] text-zinc-400 font-mono">response</span>
                  <div className="ml-auto flex items-center gap-1">
                    <CopyButton text={item.rawResponse!} />
                  </div>
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">
                    {responseExpanded ? item.rawResponse : responsePreview}
                    {responseHasMore && !responseExpanded && (
                      <span className="text-zinc-600">…</span>
                    )}
                  </p>
                  {responseHasMore && (
                    <button
                      onClick={() => setResponseExpanded((v) => !v)}
                      className="mt-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {responseExpanded ? "접기" : `더 보기 (${item.rawResponse!.length}자)`}
                    </button>
                  )}
                </div>
              </div>
            )}

            {item.diff && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
                <div
                  role="button"
                  className="w-full flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors cursor-pointer"
                  onClick={() => setDiffExpanded((v) => !v)}
                >
                  <GitCommit size={11} className="text-blue-400" />
                  <span className="text-[11px] text-zinc-400 font-mono">diff</span>
                  {shortHash && (
                    <span className="text-[10px] font-mono text-zinc-600 ml-1">{shortHash}</span>
                  )}
                  <div className="ml-auto flex items-center gap-1.5">
                    <CopyButton text={item.diff} />
                    {diffExpanded ? <ChevronUp size={11} className="text-zinc-500" /> : <ChevronDown size={11} className="text-zinc-500" />}
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
                  <span className="text-[10px] text-zinc-600 font-mono">commit</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{item.commitHash}</span>
                  <CopyButton text={item.commitHash} />
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-600 font-mono">event_id</span>
                <span className="text-[10px] text-zinc-500 font-mono">{item.eventId}</span>
                <CopyButton text={item.eventId} />
              </div>
            </div>

            <CommentSection eventId={item.eventId} workspaceId={workspaceId} />
          </div>
        )}
      </div>
    </div>
  );
}
