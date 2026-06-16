"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAiTrendQuery } from "@/application/queries/dashboardQueries";
import type { AiTrendBucket } from "@/domain/entities";

type Period = "1d" | "7d" | "30d";

const PERIOD_LABELS: Record<Period, string> = {
  "1d": "오늘",
  "7d": "이번 주",
  "30d": "이번 달",
};

function formatBucket(bucket: string, period: Period): string {
  const d = new Date(bucket);
  if (period === "1d") {
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

function computeCorrelation(buckets: AiTrendBucket[]): { highAvg: number; lowAvg: number } | null {
  if (buckets.length < 2) return null;
  const high = buckets.filter((b) => b.avgAi >= 0.5);
  const low = buckets.filter((b) => b.avgAi < 0.5);
  if (high.length === 0 || low.length === 0) return null;
  const highAvg = high.reduce((s, b) => s + b.total, 0) / high.length;
  const lowAvg = low.reduce((s, b) => s + b.total, 0) / low.length;
  return { highAvg, lowAvg };
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const commitEntry = payload.find((p) => p.name === "커밋");
  const aiEntry = payload.find((p) => p.name === "AI 기여도");
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs shadow-lg space-y-0.5">
      <p className="text-slate-500 mb-1 font-medium">{label}</p>
      {commitEntry && (
        <p className="text-slate-800 font-semibold">커밋 {commitEntry.value}건</p>
      )}
      {aiEntry && (
        <p className="text-violet-600 font-medium">AI 기여도 {Math.round((aiEntry.value as number) * 100)}%</p>
      )}
    </div>
  );
}

interface Props {
  workspaceId: string;
}

export function AiTrendChart({ workspaceId }: Props) {
  const [period, setPeriod] = useState<Period>("7d");
  const { data, isLoading } = useAiTrendQuery(workspaceId, period);

  const chartData = useMemo(
    () =>
      (data?.buckets ?? []).map((b) => ({
        label: formatBucket(b.bucket, period),
        total: b.total,
        avgAi: b.avgAi,
      })),
    [data, period]
  );

  const correlation = useMemo(
    () => computeCorrelation(data?.buckets ?? []),
    [data]
  );

  const corr = correlation
    ? correlation.highAvg > correlation.lowAvg
      ? { label: `AI 기여 높은 날 평균 ${correlation.highAvg.toFixed(1)}커밋 vs 낮은 날 ${correlation.lowAvg.toFixed(1)}커밋`, positive: true }
      : { label: `AI 기여 낮은 날 평균 ${correlation.lowAvg.toFixed(1)}커밋 vs 높은 날 ${correlation.highAvg.toFixed(1)}커밋`, positive: false }
    : null;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">팀 생산성 리듬</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">커밋 속도 × AI 기여도</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                period === p
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {corr && (
        <div className={`text-[11px] px-2.5 py-1.5 rounded-lg mb-3 font-medium ${
          corr.positive
            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
            : "bg-slate-50 text-slate-500 border border-slate-100"
        }`}>
          {corr.positive ? "↑ " : "— "}{corr.label}
        </div>
      )}

      {isLoading ? (
        <div className="h-44 flex items-center justify-center">
          <span className="text-xs text-slate-400">로딩 중...</span>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-44 flex items-center justify-center">
          <p className="text-xs text-slate-400">이 기간에 데이터가 없습니다</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 28, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="commits"
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="ai"
              orientation="right"
              domain={[0, 1]}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="commits"
              dataKey="total"
              name="커밋"
              fill="#e2e8f0"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Line
              yAxisId="ai"
              type="monotone"
              dataKey="avgAi"
              name="AI 기여도"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#7c3aed" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      <div className="flex gap-4 mt-2 justify-center">
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 inline-block" /> 커밋 수
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <span className="w-3 h-0.5 bg-violet-600 inline-block" /> AI 기여도
        </span>
      </div>
    </div>
  );
}
