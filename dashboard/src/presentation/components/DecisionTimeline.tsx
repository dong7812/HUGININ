"use client";

import { useState } from "react";
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

function formatK(n: number | null) {
  if (n === null) return null;
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// 외부 라이브러리 없이 diff를 컬러링
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

// SRP: git-log 스타일 AI 결정 타임라인만 담당
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

  const items = data?.items ?? [];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GitCommit size={15} className="text-violet-400" />
            <span className="text-sm font-medium text-zinc-200">AI 결정 타임라인</span>
            {isSearching ? (
              <span className="text-xs text-zinc-500 font-mono">
                {data?.total ?? 0}건
              </span>
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

        {/* Search bar */}
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
  isLast,
}: {
  item: FeedItem;
  workspaceId: string;
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

  // response 300자 미리보기
  const responsePreview = item.rawResponse
    ? item.rawResponse.slice(0, 300)
    : null;
  const responseHasMore = item.rawResponse && item.rawResponse.length > 300;

  return (
    <div className="flex gap-0 group hover:bg-zinc-900/50 transition-colors">
      {/* Graph line — git-log 스타일 */}
      <div className="flex flex-col items-center w-12 shrink-0 pt-3.5">
        <div
          className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-zinc-950 ${
            STATUS_DOT[item.status] ?? "bg-zinc-500"
          }`}
        />
        {!isLast && <div className="w-px flex-1 bg-zinc-800 mt-1" />}
      </div>

      {/* Content */}
      <div className={`flex-1 py-3 pr-4 ${!isLast ? "border-b border-zinc-800/50" : ""}`}>
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-zinc-200 leading-snug line-clamp-2 flex-1">
            {item.promptPreview}
          </p>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 p-0.5 text-zinc-600 hover:text-zinc-300 transition-colors mt-0.5"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
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
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
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

          {/* Comment count badge */}
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
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-3 flex flex-col gap-2">
            {/* Prompt full */}
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

            {/* AI Response */}
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

            {/* Diff */}
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

            {/* Commit hash + event id */}
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

            {/* Comments */}
            <CommentSection eventId={item.eventId} workspaceId={workspaceId} />
          </div>
        )}
      </div>
    </div>
  );
}
