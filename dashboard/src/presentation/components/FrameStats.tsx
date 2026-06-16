"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { useFrameStatsQuery } from "@/application/queries/dashboardQueries";

interface Props {
  workspaceId: string;
}

const FRAME_LABEL: Record<string, string> = {
  A: "Human-led",
  B: "AI-assisted",
  C: "AI-led",
  D: "Automated",
};
const FRAME_COLOR: Record<string, string> = {
  A: "#0ea5e9",  // sky-500
  B: "#7c3aed",  // violet-700
  C: "#10b981",  // emerald-500
  D: "#f97316",  // orange-500
};
const FRAME_BG: Record<string, string> = {
  A: "bg-sky-50 border-sky-100 text-sky-700",
  B: "bg-violet-50 border-violet-100 text-violet-700",
  C: "bg-emerald-50 border-emerald-100 text-emerald-700",
  D: "bg-orange-50 border-orange-100 text-orange-700",
};

const DAYS_OPTIONS = [7, 30, 90] as const;

const FRAME_DESC: Record<string, { who: string; desc: string }> = {
  A: { who: "인간 주도",   desc: "인간이 설계·결정, AI는 질문 답변 정도" },
  B: { who: "AI 보조",     desc: "AI가 초안·코드 제안, 인간이 검토·수정" },
  C: { who: "AI 주도",     desc: "AI가 구현 대부분, 인간은 방향·검수" },
  D: { who: "자동화",       desc: "AI가 독립 실행, 인간 개입 최소" },
};

function FrameLegendPanel() {
  return (
    <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-slate-100 mt-1">
      {(["A", "B", "C", "D"] as const).map((f) => (
        <div key={f} className={`rounded-xl border px-2.5 py-2 ${FRAME_BG[f]}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[11px] font-bold font-mono">{f}</span>
            <span className="text-[10px] opacity-70">{FRAME_DESC[f].who}</span>
          </div>
          <p className="text-[10px] opacity-60 leading-snug">{FRAME_DESC[f].desc}</p>
        </div>
      ))}
    </div>
  );
}

export function FrameStats({ workspaceId }: Props) {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [showLegend, setShowLegend] = useState(false);
  const { data, isLoading } = useFrameStatsQuery(workspaceId, days);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex flex-col gap-3">
        <div className="h-4 w-28 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-6 w-full bg-slate-100 rounded-lg animate-pulse" />
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-8 w-full bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
        <p className="text-xs text-slate-400 text-center py-4">
          아직 분석된 이벤트가 없습니다
        </p>
      </div>
    );
  }

  const frames = ["A", "B", "C", "D"] as const;
  const total = data.total;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500" />
          <span className="text-sm font-semibold text-slate-800">AI 협업 패턴</span>
          <span className="text-xs text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded-md">{total}</span>
          <button
            onClick={() => setShowLegend((v) => !v)}
            className={`transition-colors ${showLegend ? "text-violet-500" : "text-slate-300 hover:text-slate-500"}`}
            title="Frame 설명"
          >
            <Info size={13} />
          </button>
        </div>
        <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-medium transition-all ${
                days === d
                  ? "bg-white text-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Big number */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-violet-600 font-mono">
            {Math.round(data.avgAiContribution * 100)}%
          </span>
          <span className="text-xs text-slate-400">평균 AI 기여도</span>
        </div>

        {/* Stacked bar */}
        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 rounded-full overflow-hidden flex">
            {frames.map((f) => {
              const count = data.distribution[f] ?? 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={f}
                  style={{ width: `${pct}%`, backgroundColor: FRAME_COLOR[f] }}
                  title={`${f}: ${count} (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            {frames.map((f) => {
              const count = data.distribution[f] ?? 0;
              if (count === 0) return null;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={f} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: FRAME_COLOR[f] }} />
                  <span className="text-[10px] text-slate-500 font-mono">
                    {f} {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Frame grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {frames.map((f) => {
            const count = data.distribution[f] ?? 0;
            return (
              <div key={f} className={`rounded-xl border px-2 py-2.5 text-center ${FRAME_BG[f]}`}>
                <div className="text-lg font-bold font-mono">{count}</div>
                <div className="text-[9px] uppercase tracking-wider opacity-60 mt-0.5">{f}</div>
                <div className="text-[9px] opacity-50 leading-tight mt-0.5">{FRAME_LABEL[f]}</div>
              </div>
            );
          })}
        </div>

        {/* Per-member */}
        {data.byMember.length > 0 && (
          <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">팀원별 패턴</p>
            {data.byMember.map((m) => (
              <div key={m.userEmail} className="flex items-center gap-2">
                <span className="text-[11px] text-slate-600 w-20 truncate shrink-0">
                  {m.userName || m.userEmail.split("@")[0]}
                </span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden flex bg-slate-100">
                  {frames.map((f) => {
                    const count = m[f] as number;
                    const pct = m.total > 0 ? (count / m.total) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={f}
                        style={{ width: `${pct}%`, backgroundColor: FRAME_COLOR[f] }}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-400 font-mono w-8 text-right shrink-0">
                  {Math.round(m.avgAi * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
        {showLegend && <FrameLegendPanel />}
      </div>
    </div>
  );
}
