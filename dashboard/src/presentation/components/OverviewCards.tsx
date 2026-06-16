"use client";

import { Users, FolderOpen, Zap, Calendar, Database } from "lucide-react";
import { useOverviewQuery } from "@/application/queries/dashboardQueries";
import type { TimeRange } from "./WorkspaceDashboard";

interface Props {
  workspaceId: string;
  selectedRange: TimeRange;
  onSelectRange: (r: TimeRange) => void;
}

export function OverviewCards({ workspaceId, selectedRange, onSelectRange }: Props) {
  const { data, isLoading } = useOverviewQuery(workspaceId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-28 bg-slate-100 rounded-xl animate-pulse" />
        ))}
        <div className="ml-auto flex gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-9 w-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const filterButtons: { range: TimeRange; label: string; value: number | undefined; icon: typeof Zap }[] = [
    { range: "today", label: "오늘", value: data?.eventsToday, icon: Zap },
    { range: "week", label: "이번 주", value: data?.eventsWeek, icon: Calendar },
    { range: "all", label: "전체", value: data?.eventsTotal, icon: Database },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filterButtons.map(({ range, label, value, icon: Icon }) => {
        const active = selectedRange === range;
        return (
          <button
            key={range}
            onClick={() => onSelectRange(range)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
              active
                ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-sm"
            }`}
          >
            <Icon size={13} className={active ? "text-violet-200" : "text-slate-400"} />
            <span>{label}</span>
            {value !== undefined && (
              <span className={`font-mono text-xs ${active ? "text-violet-200" : "text-slate-400"}`}>
                {value.toLocaleString()}
              </span>
            )}
          </button>
        );
      })}

      <div className="h-5 w-px bg-slate-200 mx-1" />

      <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-sm">
        <Users size={13} className="text-emerald-500" />
        <span className="text-xs text-slate-500">팀원</span>
        <span className="text-xs font-mono font-semibold text-slate-700">{data?.memberCount ?? "—"}</span>
      </div>
      <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-sm">
        <FolderOpen size={13} className="text-orange-500" />
        <span className="text-xs text-slate-500">프로젝트</span>
        <span className="text-xs font-mono font-semibold text-slate-700">{data?.projectCount ?? "—"}</span>
      </div>
    </div>
  );
}
