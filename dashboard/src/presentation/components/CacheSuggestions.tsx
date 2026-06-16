"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCacheSuggestionsQuery } from "@/application/queries/dashboardQueries";
import type { CacheSuggestion } from "@/domain/entities";

const PAGE_SIZE = 3;

const PRIORITY_STYLE: Record<string, string> = {
  HIGH: "bg-red-500/15 text-red-400 border-red-500/30",
  MED:  "bg-amber-500/15 text-amber-400 border-amber-500/30",
  LOW:  "bg-zinc-700/40 text-zinc-400 border-zinc-600/30",
};

const PRIORITY_LABEL: Record<string, string> = {
  HIGH: "긴급",
  MED:  "권장",
  LOW:  "참고",
};

function SuggestionCard({ s }: { s: CacheSuggestion }) {
  return (
    <div className="flex gap-3 py-3 border-b border-zinc-800 last:border-0">
      {/* 우선순위 배지 */}
      <span
        className={`flex-shrink-0 mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${PRIORITY_STYLE[s.priority]}`}
      >
        {PRIORITY_LABEL[s.priority]}
      </span>

      <div className="min-w-0">
        {/* 도메인 + 반복 횟수 */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-zinc-200">{s.domain}</span>
          <span className="text-[10px] text-zinc-500">{s.count}회 반복</span>
        </div>

        {/* 액션 */}
        <p className="text-[11px] text-violet-300 mt-0.5">→ {s.action}</p>

        {/* 예시 (있을 때만) */}
        {s.example && s.suggestionType === "domain" && (
          <p className="text-[10px] text-zinc-500 mt-1 truncate" title={s.example}>
            예: {s.example}
          </p>
        )}
        {s.example && s.suggestionType === "decision_type" && (
          <p className="text-[10px] text-zinc-500 mt-1">{s.example}</p>
        )}
      </div>
    </div>
  );
}

interface Props {
  workspaceId: string;
}

export function CacheSuggestions({ workspaceId }: Props) {
  const { data, isLoading } = useCacheSuggestionsQuery(workspaceId);
  const [page, setPage] = useState(0);

  const suggestions = data?.suggestions ?? [];
  const totalPages = Math.ceil(suggestions.length / PAGE_SIZE);
  const paginated = suggestions.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">캐시 전략 제안</h3>
          {data && (
            <p className="text-[10px] text-zinc-500 mt-0.5">
              최근 {data.totalEventsAnalyzed}개 세션 분석 기반
            </p>
          )}
        </div>
        {data?.highTokenAlert && (
          <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
            토큰 과다 ⚠
          </span>
        )}
      </div>

      {/* 고토큰 알림 */}
      {data?.highTokenAlert && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-3">
          <p className="text-[11px] text-amber-300">
            평균 프롬프트 {Math.round(data.avgPromptTokens).toLocaleString()} 토큰 — 반복 컨텍스트를 CLAUDE.md에 고정하면 비용을 줄일 수 있습니다.
          </p>
        </div>
      )}

      {/* 제안 목록 */}
      {isLoading ? (
        <div className="h-32 flex items-center justify-center">
          <span className="text-xs text-zinc-500">분석 중...</span>
        </div>
      ) : !data || data.suggestions.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center gap-2">
          <p className="text-xs text-zinc-500">아직 분석할 데이터가 부족합니다</p>
          <p className="text-[10px] text-zinc-600">세션이 쌓이면 자동으로 패턴을 감지합니다</p>
        </div>
      ) : (
        <div>
          {paginated.map((s, i) => (
            <SuggestionCard key={page * PAGE_SIZE + i} s={s} />
          ))}
        </div>
      )}

      {/* 페이지네이션 + CLAUDE.md 힌트 */}
      {suggestions.length > 0 && (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[10px] text-zinc-600">
            <code className="text-zinc-500">CLAUDE.md</code>에 추가하면 자동 참조됩니다
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-5 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={12} />
              </button>
              <span className="text-[10px] font-mono text-zinc-600 tabular-nums w-8 text-center">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="w-5 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
