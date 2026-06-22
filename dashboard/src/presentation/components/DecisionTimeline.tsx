"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  GitCommit,
  GitBranch,
  GitPullRequest,
  GitMerge,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Copy,
  Check,
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

const FRAME_LABEL: Record<string, string> = {
  A: "Human-led",
  B: "AI-assisted",
  C: "AI-led",
  D: "Automated",
};

const FRAME_DOT: Record<string, string> = {
  A: "bg-sky-400",
  B: "bg-blue-500",
  C: "bg-emerald-400",
  D: "bg-orange-400",
};

const DECISION_TYPE_LABEL: Record<string, string> = {
  feature: "기능",
  bugfix: "버그픽스",
  refactor: "리팩터",
  config: "설정",
  docs: "문서",
  test: "테스트",
  infrastructure: "인프라",
  other: "기타",
};

const LANE_COLORS = ["#2563eb", "#059669", "#7c3aed", "#ea580c", "#db2777", "#ca8a04", "#0891b2", "#dc2626"];
const LANE_W = 14;
const DOT_TOP = 22;
const DOT_R = 3.5;

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
      if ((firstSeen.get(b) ?? 0) <= i && (lastSeen.get(b) ?? 0) >= i) activeLanes.push(l);
    });
    activeLanes.sort((a, b) => a - b);
    return { lane, activeLanes, isFirstInPage: firstSeen.get(branch) === i, isLastInPage: lastSeen.get(branch) === i };
  });
}

function GraphCell({ meta, isLastOverall }: { meta: GraphRowMeta; isLastOverall: boolean }) {
  const maxLane = meta.activeLanes.length > 0 ? Math.max(...meta.activeLanes) : 0;
  const width = (maxLane + 1) * LANE_W + 6;
  return (
    <div className="relative self-stretch shrink-0" style={{ width }}>
      {meta.activeLanes.map((laneIdx) => {
        const color = LANE_COLORS[laneIdx % LANE_COLORS.length];
        const cx = laneIdx * LANE_W + LANE_W / 2 + 3;
        const isMyLane = laneIdx === meta.lane;
        const showTop = isMyLane ? !meta.isFirstInPage : true;
        const showBottom = isMyLane ? !meta.isLastInPage && !isLastOverall : !isLastOverall;
        return (
          <div key={laneIdx} className="absolute inset-0 pointer-events-none">
            {showTop && <div className="absolute" style={{ left: cx - 0.5, top: 0, height: DOT_TOP - DOT_R, width: 1, backgroundColor: color, opacity: 0.25 }} />}
            {showBottom && <div className="absolute" style={{ left: cx - 0.5, top: DOT_TOP + DOT_R, bottom: 0, width: 1, backgroundColor: color, opacity: 0.25 }} />}
            {isMyLane && <div className="absolute z-10 rounded-full" style={{ left: cx - DOT_R, top: DOT_TOP - DOT_R, width: DOT_R * 2, height: DOT_R * 2, backgroundColor: color, boxShadow: "0 0 0 2px #fff" }} />}
          </div>
        );
      })}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-0.5 text-neutral-300 hover:text-neutral-600 transition-colors">
      {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
    </button>
  );
}

function DiffView({ diff }: { diff: string }) {
  return (
    <pre className="text-[11px] leading-5 overflow-x-auto font-mono whitespace-pre bg-neutral-50 p-3 rounded-xl">
      {diff.split("\n").map((line, i) => {
        let cls = "text-neutral-400";
        if (line.startsWith("+") && !line.startsWith("+++")) cls = "text-emerald-600";
        else if (line.startsWith("-") && !line.startsWith("---")) cls = "text-red-500";
        else if (line.startsWith("@@")) cls = "text-blue-500";
        return <span key={i} className={`block ${cls}`}>{line || " "}</span>;
      })}
    </pre>
  );
}

export function DecisionTimeline({ workspaceId, dateFrom, submittedQuery, onSearch }: Props) {
  const [page, setPage] = useState(0);
  const [branch, setBranch] = useState<string | undefined>(undefined);
  const [frame, setFrame] = useState<string | undefined>(undefined);
  const [inputValue, setInputValue] = useState(submittedQuery);
  const [debouncedInput, setDebouncedInput] = useState(submittedQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const limit = 15;

  useEffect(() => { if (!submittedQuery) setInputValue(""); }, [submittedQuery]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedInput(inputValue), 250);
    return () => clearTimeout(t);
  }, [inputValue]);

  const isSearching = submittedQuery.trim().length >= 2;
  const feedResult = useFeedQuery(workspaceId, page, limit, branch, dateFrom, frame);
  const searchResult = useSearchQuery(workspaceId, submittedQuery);
  const smartResult = useSmartSearchQuery(workspaceId, submittedQuery);
  const { data: suggestions } = useSuggestQuery(workspaceId, debouncedInput);
  const { data: branches } = useBranchesQuery(workspaceId);

  const { data, isLoading } = isSearching ? searchResult : feedResult;
  const totalPages = !isSearching && data ? Math.ceil(data.total / limit) : 0;
  const items = data?.items ?? [];
  const graphLayout = useMemo(() => computeGraphLayout(items), [items]);

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex gap-4 px-5 py-4 ${i < 4 ? "border-b border-neutral-100" : ""}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 animate-pulse mt-2 shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-3/4 bg-neutral-100 rounded-lg animate-pulse mb-2" />
              <div className="h-3 w-1/3 bg-neutral-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-neutral-100">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-neutral-900">결정 타임라인</h2>
            <span className="text-sm text-neutral-400 font-mono">{data?.total ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            {!isSearching && branches && branches.length > 1 && (
              <select
                value={branch ?? ""}
                onChange={(e) => { setBranch(e.target.value === "" ? undefined : e.target.value); setPage(0); }}
                className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 text-neutral-600 focus:outline-none focus:border-blue-400 appearance-none cursor-pointer bg-white"
              >
                <option value="">모든 브랜치</option>
                {branches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            {!isSearching && totalPages > 1 && (
              <div className="flex items-center gap-0.5">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                  className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-neutral-100 transition-colors text-neutral-500">
                  <ChevronLeft size={13} />
                </button>
                <span className="text-xs text-neutral-400 px-1 font-mono">{page + 1}/{totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                  className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-neutral-100 transition-colors text-neutral-500">
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
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
            placeholder="결정 내용, 문제, 키워드로 검색..."
            className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-8 py-2.5 text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
          {inputValue && (
            <button onClick={() => { setInputValue(""); setDebouncedInput(""); onSearch(""); setShowSuggestions(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              <X size={13} />
            </button>
          )}
          {showSuggestions && suggestions && suggestions.length > 0 && inputValue.trim().length >= 1 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <button key={i} onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setInputValue(s.text); onSearch(s.text); setShowSuggestions(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0">
                  <Search size={11} className="shrink-0 text-neutral-400" />
                  <span className="flex-1 text-sm text-neutral-700 truncate">{s.text}</span>
                  {s.decision_type && (
                    <span className="text-[10px] text-neutral-400 font-mono bg-neutral-100 px-1.5 py-0.5 rounded">{s.decision_type}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Frame filter */}
      {!isSearching && (
        <div className="px-5 pb-3 flex items-center gap-1.5">
          {(["A", "B", "C", "D"] as const).map((f) => {
            const active = frame === f;
            const dotCls = FRAME_DOT[f];
            return (
              <button
                key={f}
                onClick={() => { setFrame(active ? undefined : f); setPage(0); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  active
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white" : dotCls}`} />
                {f} · {FRAME_LABEL[f]}
              </button>
            );
          })}
          {frame && (
            <button
              onClick={() => { setFrame(undefined); setPage(0); }}
              className="ml-1 text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              초기화
            </button>
          )}
        </div>
      )}

      {/* Smart Search Panel */}
      {isSearching && (
        <SmartSearchPanel
          query={submittedQuery}
          synthesis={smartResult.data?.synthesis}
          events={smartResult.data?.events ?? []}
          isLoading={smartResult.isLoading}
        />
      )}

      {items.length === 0 && !isSearching ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-neutral-400">
          <GitCommit size={28} className="opacity-30" />
          <p className="text-sm font-medium text-neutral-500">아직 수집된 AI 결정이 없습니다</p>
          <p className="text-xs text-neutral-400 text-center max-w-xs leading-relaxed">
            Git hook 또는 MCP로 Claude Code를 사용하면 자동으로 수집됩니다
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
  const laneColor = LANE_COLORS[graphMeta.lane % LANE_COLORS.length];
  const isMerged = item.eventType === "pr_merged";
  const isClosed = item.eventType === "pr_closed";
  const PrIcon = isMerged ? GitMerge : GitPullRequest;
  const prLabel = isMerged ? "merged" : isClosed ? "closed" : "opened";
  const prColor = isMerged ? "text-blue-600" : isClosed ? "text-red-500" : "text-emerald-600";
  const author = item.githubAuthor || item.userName || item.userEmail.split("@")[0];

  return (
    <div className={`flex hover:bg-neutral-50 transition-colors ${!isLast ? "border-b border-neutral-100" : ""}`}>
      <GraphCell meta={graphMeta} isLastOverall={isLast} />
      <div className="flex-1 py-4 pr-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <PrIcon size={14} className={`${prColor} shrink-0 mt-0.5`} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 line-clamp-1 leading-snug">
                {item.whatWasBuilt || item.promptPreview.replace(/^#\d+:\s*/, "")}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-[10px] font-mono font-semibold ${prColor}`}>PR #{item.prNumber} · {prLabel}</span>
                <span className="text-[10px] text-neutral-400">@{author}</span>
                {item.branch && (
                  <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: laneColor }}>
                    <GitBranch size={9} />{item.branch}
                  </span>
                )}
                <span className="text-[10px] text-neutral-300 ml-auto">
                  {date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => setExpanded((v) => !v)}
            className="shrink-0 p-1 rounded-lg text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
        {expanded && (
          <div className="mt-3 ml-6 flex flex-col gap-2">
            {item.aiRole && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                <p className="text-xs text-neutral-400 uppercase tracking-wider font-semibold mb-1.5">PR 분석</p>
                <p className="text-sm text-neutral-700 leading-relaxed">{item.aiRole}</p>
              </div>
            )}
            {item.prUrl && (
              <a href={item.prUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <ExternalLink size={12} />GitHub에서 보기
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineEntry({ item, workspaceId, graphMeta, isLast }: {
  item: FeedItem; workspaceId: string; graphMeta: GraphRowMeta; isLast: boolean;
}) {
  if (item.eventType?.startsWith("pr_")) return <PrCard item={item} graphMeta={graphMeta} isLast={isLast} />;

  const [expanded, setExpanded] = useState(false);
  const [diffExpanded, setDiffExpanded] = useState(false);
  const date = new Date(item.createdAt);
  const shortHash = item.commitHash ? item.commitHash.slice(0, 7) : null;
  const laneColor = LANE_COLORS[graphMeta.lane % LANE_COLORS.length];

  const isPending = item.status === "pending";
  const titleText = item.whatWasBuilt || item.decisionSummary;
  const aiPct = item.aiContribution !== null ? Math.round((item.aiContribution ?? 0) * 100) : null;

  return (
    <div className={`flex hover:bg-neutral-50 transition-colors ${!isLast ? "border-b border-neutral-100" : ""}`}>
      <GraphCell meta={graphMeta} isLastOverall={isLast} />

      <div className="flex-1 py-4 pr-5">
        {/* Title */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {titleText ? (
              <p className="text-sm font-semibold text-neutral-900 line-clamp-1 leading-snug">{titleText}</p>
            ) : (
              <p className="text-sm text-neutral-400 font-mono line-clamp-1 leading-snug">{item.promptPreview}</p>
            )}
            {item.problemSolved && !expanded && (
              <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5 leading-relaxed">{item.problemSolved}</p>
            )}
          </div>
          <button onClick={() => setExpanded((v) => !v)}
            className="shrink-0 p-1 rounded-lg text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Meta row — compact */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {item.frame && (
            <span className="flex items-center gap-1 text-[10px] font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${FRAME_DOT[item.frame]}`} />
              <span className="text-neutral-500">{FRAME_LABEL[item.frame]}</span>
              {aiPct !== null && <span className="text-neutral-400">{aiPct}%</span>}
            </span>
          )}
          {isPending && !item.frame && (
            <span className="text-[10px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded font-mono">처리 중</span>
          )}
          {item.decisionType && DECISION_TYPE_LABEL[item.decisionType] && (
            <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded font-mono">
              {DECISION_TYPE_LABEL[item.decisionType]}
            </span>
          )}
          {item.rejectedAlternatives && (
            <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-mono">× 기각됨</span>
          )}
          {item.branch && (
            <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: laneColor }}>
              <GitBranch size={9} />{item.branch}
            </span>
          )}
          {shortHash && (
            <span className="text-[10px] font-mono text-neutral-300">{shortHash}</span>
          )}
          {item.commentCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-neutral-400">
              <MessageSquare size={9} />{item.commentCount}
            </span>
          )}
          <span className="text-[10px] text-neutral-300 ml-auto">
            <Clock size={9} className="inline mr-0.5 -mt-0.5" />
            {date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} {date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Expanded */}
        {expanded && (
          <div className="mt-4 flex flex-col gap-2.5">
            {/* 왜 만들었나 */}
            {item.problemSolved && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">왜 만들었나</p>
                <p className="text-sm text-blue-900 leading-relaxed">{item.problemSolved}</p>
              </div>
            )}

            {/* 선택 이유 — 왜 이 방향인가 (커밋 메시지에 있을 수 있지만 요약) */}
            {item.tradeoffs && (
              <p className="text-xs text-neutral-500 leading-relaxed px-0.5">{item.tradeoffs}</p>
            )}

            {/* 기각된 대안 — git에 없는 것, 핵심 차별점 */}
            {item.rejectedAlternatives && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1.5">× 고려했지만 선택 안 한 것</p>
                <p className="text-sm text-red-900 leading-relaxed">{item.rejectedAlternatives}</p>
              </div>
            )}

            {/* 암묵적 제약 — 코드 어디에도 없는 당시 맥락 */}
            {item.implicitConstraints && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">당시 제약</p>
                <p className="text-sm text-amber-900 leading-relaxed">{item.implicitConstraints}</p>
              </div>
            )}

            {/* AI 기여도 시각화 */}
            {item.frame && aiPct !== null && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-neutral-400 font-mono font-semibold">{item.frame} · {FRAME_LABEL[item.frame]}</span>
                <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden max-w-[160px]">
                  <div className={`h-full rounded-full ${FRAME_DOT[item.frame]}`} style={{ width: `${aiPct}%` }} />
                </div>
                <span className="text-[10px] font-mono text-neutral-500">AI {aiPct}%</span>
              </div>
            )}

            {/* Diff */}
            {item.diff && (
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-2 px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100 transition-colors text-left"
                  onClick={() => setDiffExpanded((v) => !v)}
                >
                  <GitCommit size={11} className="text-neutral-400" />
                  <span className="text-xs text-neutral-500 font-mono flex-1">diff</span>
                  {shortHash && <span className="text-[10px] font-mono text-neutral-400">{shortHash}</span>}
                  <CopyButton text={item.diff} />
                  {diffExpanded ? <ChevronUp size={11} className="text-neutral-400" /> : <ChevronDown size={11} className="text-neutral-400" />}
                </button>
                {diffExpanded && (
                  <div className="px-3 py-2.5 max-h-72 overflow-y-auto">
                    <DiffView diff={item.diff} />
                  </div>
                )}
              </div>
            )}

            {/* Commit + Comments */}
            <div className="flex items-center gap-4 text-[10px] text-neutral-400 font-mono">
              {item.commitHash && (
                <div className="flex items-center gap-1.5">
                  <span>commit</span>
                  <span className="text-neutral-500">{item.commitHash.slice(0, 12)}</span>
                  <CopyButton text={item.commitHash} />
                </div>
              )}
              <span className="text-neutral-300">{item.userEmail.split("@")[0]}</span>
              {item.projectName && <span className="text-neutral-300">{item.projectName}</span>}
            </div>

            <CommentSection eventId={item.eventId} workspaceId={workspaceId} />
          </div>
        )}
      </div>
    </div>
  );
}

const SS_TYPE_COLOR: Record<string, string> = {
  feature: "text-blue-600", bugfix: "text-red-500", refactor: "text-amber-600",
  config: "text-neutral-500", docs: "text-blue-400", test: "text-emerald-600", other: "text-neutral-400",
};

function SmartSearchPanel({ query, synthesis, events, isLoading }: {
  query: string; synthesis?: string; events: SmartSearchEvent[]; isLoading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const COLLAPSE_CHARS = 600;
  const isLong = (synthesis?.length ?? 0) > COLLAPSE_CHARS;
  const displayText = isLong && !expanded ? synthesis!.slice(0, COLLAPSE_CHARS).trimEnd() + "…" : synthesis;

  if (isLoading) {
    return (
      <div className="mx-5 mt-4 mb-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs text-blue-500 font-medium">결정 패턴 분석 중...</span>
        </div>
        {[3, 4, 2].map((w, i) => <div key={i} className={`h-3 w-${w}/4 bg-blue-100 rounded-lg animate-pulse`} />)}
      </div>
    );
  }
  if (!synthesis && events.length === 0) return null;

  return (
    <div className="mx-5 mt-4 mb-2 rounded-2xl border border-blue-100 bg-blue-50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-100">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <span className="text-xs font-semibold text-blue-700">AI 분석</span>
        <span className="text-xs text-neutral-500">"{query}"</span>
        <span className="ml-auto text-[10px] text-neutral-400 font-mono">{events.length}개 결정</span>
      </div>

      {synthesis && (
        <div className="px-4 py-3.5 border-b border-blue-100">
          <p className="text-sm text-neutral-700 leading-relaxed">{displayText}</p>
          {isLong && (
            <button onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors">
              {expanded ? "접기" : "더보기"}
            </button>
          )}
        </div>
      )}

      {events.length > 0 && (
        <div className="flex flex-col divide-y divide-blue-100">
          {events.map((ev, i) => (
            <div key={ev.event_id} className="flex gap-3 px-4 py-3 hover:bg-white/50 transition-colors">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[10px] font-mono text-blue-600 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[10px] font-mono text-neutral-400">{new Date(ev.created_at).toLocaleDateString("ko-KR")}</span>
                  {ev.decision_type && <span className={`text-[10px] font-mono font-semibold ${SS_TYPE_COLOR[ev.decision_type] ?? "text-neutral-400"}`}>{ev.decision_type}</span>}
                  {ev.frame && <span className="text-[10px] text-neutral-400">{{ A: "Human-led", B: "AI-assisted", C: "AI-led", D: "Automated" }[ev.frame]}</span>}
                </div>
                {ev.what_was_built && <p className="text-sm text-neutral-800 font-medium line-clamp-1">{ev.what_was_built}</p>}
                {ev.problem_solved && <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{ev.problem_solved}</p>}
              </div>
              {ev.ai_contribution != null && (
                <span className="text-[10px] font-mono text-neutral-400 shrink-0">AI {Math.round(ev.ai_contribution * 100)}%</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
