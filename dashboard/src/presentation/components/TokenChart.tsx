"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTokenStatsQuery } from "@/application/queries/dashboardQueries";

interface Props {
  workspaceId: string;
  days?: number;
  branch?: string;
}

function formatK(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// SRP: 토큰 사용 추이 차트만 담당
export function TokenChart({ workspaceId, days = 30, branch }: Props) {
  const { data, isLoading } = useTokenStatsQuery(workspaceId, days, branch);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-200">토큰 사용량</p>
          <p className="text-xs text-zinc-500 mt-0.5">최근 {days}일</p>
        </div>
        {data && (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-zinc-500">
              <span className="text-violet-400 font-mono">{formatK(data.totalPrompt)}</span> prompt
            </span>
            <span className="text-xs text-zinc-500">
              <span className="text-emerald-400 font-mono">{formatK(data.totalResponse)}</span> response
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full h-40 bg-zinc-800 rounded animate-pulse" />
        </div>
      ) : !data || data.daily.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
          데이터 없음
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.daily} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              tick={{ fontSize: 10, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatK}
              tick={{ fontSize: 10, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 6,
                fontSize: 11,
              }}
              labelStyle={{ color: "#a1a1aa", marginBottom: 4 }}
              labelFormatter={(label) => {
                const d = new Date(label as string);
                return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
              }}
              formatter={(value, name) => [
                formatK(value as number),
                name === "promptTokens" ? "Prompt" : "Response",
              ]}
            />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: 10, color: "#71717a" }}>
                  {value === "promptTokens" ? "Prompt" : "Response"}
                </span>
              )}
            />
            <Bar dataKey="promptTokens" stackId="a" fill="#7c3aed" radius={[0, 0, 0, 0]} />
            <Bar dataKey="responseTokens" stackId="a" fill="#059669" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
