"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCacheSuggestionsQuery } from "@/application/queries/dashboardQueries";
import type { CacheSuggestion } from "@/domain/entities";

const PAGE_SIZE = 3;

const PRIORITY_STYLE: Record<string, string> = {
  HIGH: "bg-red-50 text-red-600 border-red-100",
  MED:  "bg-amber-50 text-amber-600 border-amber-100",
  LOW:  "bg-slate-50 text-slate-500 border-slate-200",
};

const PRIORITY_LABEL: Record<string, string> = {
  HIGH: "긴급",
  MED:  "권장",
  LOW:  "참고",
};

function SuggestionCard({ s }: { s: CacheSuggestion }) {
  return (
    <div className="flex gap-3 py-3 border-b border-slate-100 last:border-0">
      <span className={`flex-shrink-0 mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${PRIORITY_STYLE[s.priority]}`}>
        {PRIORITY_LABEL[s.priority]}
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-slate-800">{s.domain}</span>
          <span className="text-[10px] text-slate-400">{s.count}회 반복</span>
        </div>
        <p className="text-[11px] text-violet-600 font-medium mt-0.5">→ {s.action}</p>
        {s.example && s.suggestionType === "domain" && (
          <p className="text-[10px] text-slate-400 mt-1 truncate" title={s.example}>
            예: {s.example}
          </p>
        )}
        {s.example && s.suggestionType === "decision_type" && (
          <p className="text-[10px] text-slate-400 mt-1">{s.example}</p>
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
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">캐시 전략 제안</h3>
          {data && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              최근 {data.totalEventsAnalyzed}개 세션 분석 기반
            </p>
          )}
        </div>
        {data?.highTokenAlert && (
          <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-lg font-medium">
            토큰 과다 ⚠
          </span>
        )}
      </div>

      {data?.highTokenAlert && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mb-3">
          <p className="text-[11px] text-amber-700 leading-relaxed">
            평균 프롬프트 {Math.round(data.avgPromptTokens).toLocaleString()} 토큰 — 반복 컨텍스트를 CLAUDE.md에 고정하면 비용을 줄일 수 있습니다.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="h-32 flex items-center justify-center">
          <span className="text-xs text-slate-400">분석 중...</span>
        </div>
      ) : !data || data.suggestions.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center gap-2">
          <p className="text-xs text-slate-400">아직 분석할 데이터가 부족합니다</p>
          <p className="text-[10px] text-slate-300">세션이 쌓이면 자동으로 패턴을 감지합니다</p>
        </div>
      ) : (
        <div>
          {paginated.map((s, i) => (
            <SuggestionCard key={page * PAGE_SIZE + i} s={s} />
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            <code className="text-slate-500 bg-slate-50 px-1 rounded">CLAUDE.md</code>에 추가하면 자동 참조됩니다
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={12} />
              </button>
              <span className="text-[10px] font-mono text-slate-400 tabular-nums w-8 text-center">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
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
