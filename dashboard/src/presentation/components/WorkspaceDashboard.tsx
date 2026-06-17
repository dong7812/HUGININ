"use client";

import { useMemo, useState } from "react";
import { OverviewCards } from "./OverviewCards";
import { TokenChart } from "./TokenChart";
import { DecisionTimeline } from "./DecisionTimeline";
import { FrameStats } from "./FrameStats";
import { AiTrendChart } from "./AiTrendChart";
import { CacheSuggestions } from "./CacheSuggestions";
import { PmBriefingButton } from "./PmBriefing";
import { useWorkspaceStore } from "@/application/stores/workspaceStore";

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
  const [submittedQuery, setSubmittedQuery] = useState("");
  const workspaceName = useWorkspaceStore((s) => s.workspaceName);

  const dateFrom = useMemo(() => toDateFrom(timeRange), [timeRange]);

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Page header */}
      <div className="bg-white border-b border-neutral-100 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            {workspaceName || "Workspace"}
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">AI Decision Journal</p>
        </div>
        <PmBriefingButton workspaceId={workspaceId} />
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats strip */}
        <div className="mb-5">
          <OverviewCards
            workspaceId={workspaceId}
            selectedRange={timeRange}
            onSelectRange={(r) => {
              setTimeRange(r);
              setSubmittedQuery("");
            }}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Main timeline */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
              <DecisionTimeline
                workspaceId={workspaceId}
                dateFrom={dateFrom}
                submittedQuery={submittedQuery}
                onSearch={(q) => {
                  setSubmittedQuery(q);
                  if (q) setTimeRange("all");
                }}
              />
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4 self-start">
            <AiTrendChart workspaceId={workspaceId} />
            <FrameStats workspaceId={workspaceId} />
            <CacheSuggestions workspaceId={workspaceId} />
            <TokenChart workspaceId={workspaceId} days={timeRange === "today" ? 1 : timeRange === "week" ? 7 : 30} />
          </div>
        </div>
      </div>
    </div>
  );
}
