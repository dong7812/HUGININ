"use client";

import { useOverviewQuery } from "@/application/queries/dashboardQueries";
import type { TimeRange } from "./WorkspaceDashboard";

interface Props {
  workspaceId: string;
  selectedRange: TimeRange;
  onSelectRange: (r: TimeRange) => void;
}

const FILTERS: { range: TimeRange; label: string; key: "eventsToday" | "eventsWeek" | "eventsTotal" }[] = [
  { range: "today", label: "오늘", key: "eventsToday" },
  { range: "week",  label: "이번 주", key: "eventsWeek" },
  { range: "all",   label: "전체", key: "eventsTotal" },
];

export function OverviewCards({ workspaceId, selectedRange, onSelectRange }: Props) {
  const { data, isLoading } = useOverviewQuery(workspaceId);

  if (isLoading) {
    return (
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 w-36 bg-white rounded-2xl border border-neutral-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-stretch gap-3 flex-wrap">
      {FILTERS.map(({ range, label, key }) => {
        const active = selectedRange === range;
        const value = data?.[key] ?? 0;
        return (
          <button
            key={range}
            onClick={() => onSelectRange(range)}
            className={`flex flex-col items-start px-5 py-4 rounded-2xl border transition-all text-left ${
              active
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300"
            }`}
          >
            <span className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${active ? "text-blue-200" : "text-neutral-400"}`}>
              {label}
            </span>
            <span className="text-2xl font-bold font-mono leading-none">{value.toLocaleString()}</span>
            <span className={`text-[10px] mt-1 ${active ? "text-blue-200" : "text-neutral-400"}`}>decisions</span>
          </button>
        );
      })}

      <div className="w-px bg-neutral-200 mx-1 self-stretch" />

      <div className="flex flex-col items-start px-5 py-4 rounded-2xl border border-neutral-200 bg-white">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">팀원</span>
        <span className="text-2xl font-bold font-mono leading-none text-neutral-900">{data?.memberCount ?? "—"}</span>
        <span className="text-[10px] text-neutral-400 mt-1">members</span>
      </div>

      <div className="flex flex-col items-start px-5 py-4 rounded-2xl border border-neutral-200 bg-white">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">프로젝트</span>
        <span className="text-2xl font-bold font-mono leading-none text-neutral-900">{data?.projectCount ?? "—"}</span>
        <span className="text-[10px] text-neutral-400 mt-1">repos</span>
      </div>
    </div>
  );
}
