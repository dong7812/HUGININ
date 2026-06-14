"use client";

import { Users, FolderOpen, Zap, Calendar, Database } from "lucide-react";
import { useOverviewQuery } from "@/application/queries/dashboardQueries";
import type { TimeRange } from "./WorkspaceDashboard";

interface Props {
  workspaceId: string;
  selectedRange: TimeRange;
  onSelectRange: (r: TimeRange) => void;
}

// SRP: 워크스페이스 통계 + 시간 필터 역할
export function OverviewCards({ workspaceId, selectedRange, onSelectRange }: Props) {
  const { data, isLoading } = useOverviewQuery(workspaceId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-28 bg-zinc-800 rounded-lg animate-pulse" />
        ))}
        <div className="ml-auto flex gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-9 w-20 bg-zinc-800 rounded-lg animate-pulse" />
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
      {/* 클릭 가능한 시간 필터 */}
      {filterButtons.map(({ range, label, value, icon: Icon }) => {
        const active = selectedRange === range;
        return (
          <button
            key={range}
            onClick={() => onSelectRange(range)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
              active
                ? "bg-violet-600/20 border-violet-500/50 text-violet-300"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            }`}
          >
            <Icon size={13} className={active ? "text-violet-400" : "text-zinc-500"} />
            <span>{label}</span>
            {value !== undefined && (
              <span className={`font-mono text-xs ${active ? "text-violet-400" : "text-zinc-600"}`}>
                {value.toLocaleString()}
              </span>
            )}
          </button>
        );
      })}

      {/* 구분선 */}
      <div className="h-5 w-px bg-zinc-800 mx-1" />

      {/* 정적 정보 (필터 없음) */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
        <Users size={13} className="text-green-500" />
        <span className="text-xs text-zinc-500">팀원</span>
        <span className="text-xs font-mono text-zinc-400">{data?.memberCount ?? "—"}</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
        <FolderOpen size={13} className="text-orange-500" />
        <span className="text-xs text-zinc-500">프로젝트</span>
        <span className="text-xs font-mono text-zinc-400">{data?.projectCount ?? "—"}</span>
      </div>
    </div>
  );
}
