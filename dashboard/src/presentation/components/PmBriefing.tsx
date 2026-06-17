"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle, AlertCircle, Info, Clock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { usePmBriefMutation } from "@/application/queries/dashboardQueries";
import type { PmBriefResult } from "@/infrastructure/http/dashboardRepository";

interface Props {
  workspaceId: string;
}

const SEVERITY_STYLE = {
  critical: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
  warning:  { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
  info:     { icon: Info, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
};

export function PmBriefing({ workspaceId }: Props) {
  const mutation = usePmBriefMutation(workspaceId);
  const [showStale, setShowStale] = useState(false);
  const brief: PmBriefResult | undefined = mutation.data;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-blue-500" />
          <h3 className="text-sm font-bold text-neutral-900">PM 브리핑</h3>
          {brief && (
            <span className="text-[10px] text-neutral-400 font-mono">{brief.event_count}개 결정 기반</span>
          )}
        </div>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {mutation.isPending ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              분석 중
            </>
          ) : brief ? "재분석" : "지금 분석하기"}
        </button>
      </div>

      {/* Loading skeleton */}
      {mutation.isPending && (
        <div className="p-5 flex flex-col gap-3">
          <div className="h-3 w-full bg-neutral-100 rounded-lg animate-pulse" />
          <div className="h-3 w-4/5 bg-neutral-100 rounded-lg animate-pulse" />
          <div className="h-3 w-3/5 bg-neutral-100 rounded-lg animate-pulse" />
          <p className="text-xs text-neutral-400 text-center mt-2">결정 패턴을 분석하고 있습니다...</p>
        </div>
      )}

      {/* Error */}
      {mutation.isError && !mutation.isPending && (
        <div className="p-5 text-center">
          <p className="text-sm text-red-500 mb-1">분석 실패</p>
          <p className="text-xs text-neutral-400">정제된 결정이 부족하거나 일시적 오류입니다.</p>
        </div>
      )}

      {/* Empty state */}
      {!brief && !mutation.isPending && !mutation.isError && (
        <div className="px-5 py-8 text-center">
          <Sparkles size={24} className="text-neutral-200 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 font-medium mb-1">결정 데이터를 PM처럼 분석</p>
          <p className="text-xs text-neutral-400 leading-relaxed">
            쌓인 결정들에서 패턴, 미해결 트레이드오프,<br />놓친 영역을 찾아 의견을 냅니다.
          </p>
        </div>
      )}

      {/* Result */}
      {brief && !mutation.isPending && (
        <div className="flex flex-col divide-y divide-neutral-100">
          {/* Summary */}
          <div className="px-5 py-4">
            <p className="text-sm text-neutral-700 leading-relaxed">{brief.summary}</p>
          </div>

          {/* Patterns */}
          {brief.patterns.length > 0 && (
            <div className="px-5 py-4 flex flex-col gap-2.5">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">발견된 패턴</p>
              {brief.patterns.map((p, i) => {
                const style = SEVERITY_STYLE[p.severity as keyof typeof SEVERITY_STYLE] ?? SEVERITY_STYLE.info;
                const Icon = style.icon;
                return (
                  <div key={i} className={`rounded-xl border ${style.border} ${style.bg} p-3`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={12} className={style.color} />
                      <span className="text-xs font-semibold text-neutral-800">{p.title}</span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">{p.detail}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Next focus */}
          {brief.next_focus.title && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">다음 집중 포인트</p>
              <div className="bg-blue-600 rounded-xl p-3.5 text-white">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ArrowRight size={12} className="text-blue-200" />
                  <span className="text-sm font-bold">{brief.next_focus.title}</span>
                </div>
                <p className="text-xs text-blue-100 leading-relaxed">{brief.next_focus.rationale}</p>
              </div>
            </div>
          )}

          {/* Stale tradeoffs */}
          {brief.stale_tradeoffs.length > 0 && (
            <div className="px-5 py-4">
              <button
                onClick={() => setShowStale((v) => !v)}
                className="flex items-center gap-2 w-full text-left mb-2"
              >
                <Clock size={11} className="text-amber-500" />
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex-1">
                  미해결 트레이드오프
                </p>
                <span className="text-[10px] font-mono text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                  {brief.stale_tradeoffs.length}개
                </span>
                {showStale ? <EyeOff size={11} className="text-neutral-400" /> : <Eye size={11} className="text-neutral-400" />}
              </button>
              {showStale && (
                <div className="flex flex-col gap-2">
                  {brief.stale_tradeoffs.map((t, i) => (
                    <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-neutral-800">{t.decision}</span>
                        <span className="text-[10px] font-mono text-neutral-400">{t.made_at}</span>
                      </div>
                      <p className="text-xs text-neutral-600 leading-relaxed">{t.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Blind spots */}
          {brief.blind_spots.length > 0 && (
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">논의되지 않은 영역</p>
              <div className="flex flex-col gap-1.5">
                {brief.blind_spots.map((b, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-neutral-300 text-xs mt-0.5">·</span>
                    <p className="text-xs text-neutral-600 leading-relaxed">{b}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
