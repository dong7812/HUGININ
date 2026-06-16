"use client";

import { useState } from "react";
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAiTrendQuery } from "@/application/queries/dashboardQueries";

type Period = "1d" | "7d" | "30d";

const PERIOD_LABELS: Record<Period, string> = {
  "1d": "오늘",
  "7d": "이번 주",
  "30d": "이번 달",
};

const FRAME_COLORS = {
  frameA: "#818cf8",  // indigo
  frameB: "#34d399",  // emerald
  frameC: "#fbbf24",  // amber
  frameD: "#f87171",  // red
};

function formatBucket(bucket: string, period: Period): string {
  const d = new Date(bucket);
  if (period === "1d") {
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
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
  const aiEntry = payload.find((p) => p.name === "AI 기여도");
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      {aiEntry && (
        <p className="text-violet-300 font-medium mb-1">
          AI 기여도 {Math.round(aiEntry.value * 100)}%
        </p>
      )}
      {payload.filter((p) => p.name !== "AI 기여도").map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          Frame {p.name.replace("frame", "")}: {p.value}건
        </p>
      ))}
    </div>
  );
}

interface Props {
  workspaceId: string;
}

export function AiTrendChart({ workspaceId }: Props) {
  const [period, setPeriod] = useState<Period>("7d");
  const { data, isLoading } = useAiTrendQuery(workspaceId, period);

  const chartData = (data?.buckets ?? []).map((b) => ({
    label: formatBucket(b.bucket, period),
    avgAi: b.avgAi,
    frameA: b.frameA,
    frameB: b.frameB,
    frameC: b.frameC,
    frameD: b.frameD,
    total: b.total,
  }));

  const delta = data?.deltaPct ?? 0;
  const deltaLabel = delta === 0
    ? "변화 없음"
    : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}% vs 이전 기간`;
  const deltaColor = delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-zinc-400";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">AI 기여도 추세</h3>
          {data && (
            <p className="text-xs mt-0.5">
              <span className="text-violet-300 font-semibold">
                {Math.round(data.currentAvgAi * 100)}%
              </span>
              <span className={`ml-2 ${deltaColor}`}>{deltaLabel}</span>
            </p>
          )}
        </div>
        <div className="flex gap-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                period === p
                  ? "bg-violet-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* 차트 */}
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="text-xs text-zinc-500">로딩 중...</div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-xs text-zinc-500">이 기간에 데이터가 없습니다</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="ai"
              domain={[0, 1]}
              tick={{ fontSize: 10, fill: "#71717a" }}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              tick={{ fontSize: 10, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              hide
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Frame stacked bars (뒤) */}
            <Bar yAxisId="count" dataKey="frameA" name="frameA" stackId="frames" fill={FRAME_COLORS.frameA} opacity={0.5} radius={0} />
            <Bar yAxisId="count" dataKey="frameB" name="frameB" stackId="frames" fill={FRAME_COLORS.frameB} opacity={0.5} radius={0} />
            <Bar yAxisId="count" dataKey="frameC" name="frameC" stackId="frames" fill={FRAME_COLORS.frameC} opacity={0.5} radius={0} />
            <Bar yAxisId="count" dataKey="frameD" name="frameD" stackId="frames" fill={FRAME_COLORS.frameD} opacity={0.5} radius={[2, 2, 0, 0]} />
            {/* AI 기여도 라인 (앞) */}
            <Area
              yAxisId="ai"
              type="monotone"
              dataKey="avgAi"
              name="AI 기여도"
              stroke="#a78bfa"
              strokeWidth={2}
              fill="url(#aiGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#a78bfa" }}
            />
            <defs>
              <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* 범례 */}
      <div className="flex gap-3 mt-2 justify-center">
        <span className="flex items-center gap-1 text-[10px] text-zinc-400">
          <span className="w-3 h-0.5 bg-violet-400 inline-block" /> AI 기여도
        </span>
        {(["A", "B", "C", "D"] as const).map((f) => (
          <span key={f} className="flex items-center gap-1 text-[10px] text-zinc-400">
            <span
              className="w-2 h-2 rounded-sm inline-block"
              style={{ backgroundColor: FRAME_COLORS[`frame${f}` as keyof typeof FRAME_COLORS] }}
            />
            Frame {f}
          </span>
        ))}
      </div>
    </div>
  );
}
