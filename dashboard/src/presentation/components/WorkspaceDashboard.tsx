"use client";

import { useMemo, useState } from "react";
import { OverviewCards } from "./OverviewCards";
import { TokenChart } from "./TokenChart";
import { DecisionTimeline } from "./DecisionTimeline";

interface Props {
  workspaceId: string;
}

export type TimeRange = "today" | "week" | "all";

function toDateFrom(range: TimeRange): string | undefined {
  if (range === "all") return undefined;
  const d = new Date();
  if (range === "today") {
    d.setHours(0, 0, 0, 0);
  } else {
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
  }
  return d.toISOString();
}

export function WorkspaceDashboard({ workspaceId }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const dateFrom = useMemo(() => toDateFrom(timeRange), [timeRange]);

  return (
    <div className="flex flex-col gap-4 p-6 max-w-6xl mx-auto w-full">
      <OverviewCards
        workspaceId={workspaceId}
        selectedRange={timeRange}
        onSelectRange={(r) => {
          setTimeRange(r);
          setSearchQuery(""); // 필터 바꾸면 검색 초기화
        }}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <DecisionTimeline
            workspaceId={workspaceId}
            dateFrom={dateFrom}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              if (q) setTimeRange("all"); // 검색하면 시간 필터 해제
            }}
          />
        </div>

        <div>
          <TokenChart workspaceId={workspaceId} days={timeRange === "today" ? 1 : timeRange === "week" ? 7 : 30} />
        </div>
      </div>
    </div>
  );
}
