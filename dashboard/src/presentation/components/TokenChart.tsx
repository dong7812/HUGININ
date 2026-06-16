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

export function TokenChart({ workspaceId, days = 30, branch }: Props) {
  const { data, isLoading } = useTokenStatsQuery(workspaceId, days, branch);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">토큰 사용량</p>
          <p className="text-xs text-slate-400 mt-0.5">최근 {days}일</p>
        </div>
        {data && (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-slate-500">
              <span className="text-violet-600 font-mono font-semibold">{formatK(data.totalPrompt)}</span> prompt
            </span>
            <span className="text-xs text-slate-500">
              <span className="text-emerald-600 font-mono font-semibold">{formatK(data.totalResponse)}</span> response
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full h-40 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      ) : !data || data.daily.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          데이터 없음
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.daily} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatK}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                fontSize: 11,
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
              }}
              labelStyle={{ color: "#64748b", marginBottom: 4 }}
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
                <span style={{ fontSize: 10, color: "#94a3b8" }}>
                  {value === "promptTokens" ? "Prompt" : "Response"}
                </span>
              )}
            />
            <Bar dataKey="promptTokens" stackId="a" fill="#7c3aed" radius={[0, 0, 0, 0]} />
            <Bar dataKey="responseTokens" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
