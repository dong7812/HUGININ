"use client";

import { useState } from "react";
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
  A: "#38bdf8",  // sky
  B: "#a78bfa",  // violet
  C: "#34d399",  // emerald
  D: "#fb923c",  // orange
};
const FRAME_BG: Record<string, string> = {
  A: "bg-sky-900/30 border-sky-700/40 text-sky-400",
  B: "bg-violet-900/30 border-violet-700/40 text-violet-400",
  C: "bg-emerald-900/30 border-emerald-700/40 text-emerald-400",
  D: "bg-orange-900/30 border-orange-700/40 text-orange-400",
};

const DAYS_OPTIONS = [7, 30, 90] as const;

export function FrameStats({ workspaceId }: Props) {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const { data, isLoading } = useFrameStatsQuery(workspaceId, days);

  if (isLoading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3">
        <div className="h-4 w-28 bg-zinc-800 rounded animate-pulse" />
        <div className="h-6 w-full bg-zinc-800 rounded animate-pulse" />
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-8 w-full bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-xs text-zinc-600 text-center py-4">
          아직 분석된 이벤트가 없습니다
        </p>
      </div>
    );
  }

  const frames = ["A", "B", "C", "D"] as const;
  const total = data.total;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-400" />
          <span className="text-sm font-medium text-zinc-200">AI 협업 패턴</span>
          <span className="text-xs text-zinc-500 font-mono">({total})</span>
        </div>
        <div className="flex items-center gap-1">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-[10px] px-2 py-0.5 rounded font-mono transition-colors ${
                days === d
                  ? "bg-violet-600/30 text-violet-300 border border-violet-600/40"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Avg AI contribution — big number */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-violet-400 font-mono">
            {Math.round(data.avgAiContribution * 100)}%
          </span>
          <span className="text-xs text-zinc-500">평균 AI 기여도</span>
        </div>

        {/* Stacked bar — Frame distribution */}
        <div className="flex flex-col gap-1.5">
          <div className="h-3 rounded-full overflow-hidden flex">
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
          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            {frames.map((f) => {
              const count = data.distribution[f] ?? 0;
              if (count === 0) return null;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={f} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: FRAME_COLOR[f] }} />
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {f} {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Frame breakdown — count per frame */}
        <div className="grid grid-cols-4 gap-1.5">
          {frames.map((f) => {
            const count = data.distribution[f] ?? 0;
            return (
              <div key={f} className={`rounded-lg border px-2 py-2 text-center ${FRAME_BG[f]}`}>
                <div className="text-lg font-bold font-mono">{count}</div>
                <div className="text-[9px] uppercase tracking-wider opacity-70 mt-0.5">{f}</div>
                <div className="text-[9px] opacity-50 leading-tight mt-0.5">{FRAME_LABEL[f]}</div>
              </div>
            );
          })}
        </div>

        {/* Per-member breakdown */}
        {data.byMember.length > 0 && (
          <div className="flex flex-col gap-1 pt-1 border-t border-zinc-800">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">팀원별 패턴</p>
            {data.byMember.map((m) => (
              <div key={m.userEmail} className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400 w-20 truncate shrink-0">
                  {m.userName || m.userEmail.split("@")[0]}
                </span>
                <div className="flex-1 h-2 rounded-full overflow-hidden flex bg-zinc-800">
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
                <span className="text-[10px] text-zinc-600 font-mono w-8 text-right shrink-0">
                  {Math.round(m.avgAi * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
