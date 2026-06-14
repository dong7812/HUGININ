"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useActivityQuery } from "@/application/queries/dashboardQueries";

interface Props {
  workspaceId: string;
  days?: number;
}

// SRP: 일별 활동 바 차트만 담당 ('use client' — recharts는 DOM 필요)
export function ActivityChart({ workspaceId, days = 30 }: Props) {
  const { data, isLoading } = useActivityQuery(workspaceId, days);

  return (
    <div className="bg-zinc-900 rounded-xl p-5 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
        일별 AI 결정 ({days}일)
      </h2>
      {isLoading ? (
        <div className="h-48 bg-zinc-800 rounded-lg animate-pulse" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data ?? []} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis tick={{ fill: "#71717a", fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: 8,
                color: "#e4e4e7",
              }}
              labelFormatter={(label) => `날짜: ${label}`}
              formatter={(value) => [value, "이벤트"]}
            />
            <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
