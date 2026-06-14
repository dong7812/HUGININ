"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, User, Folder, Clock } from "lucide-react";
import { useFeedQuery } from "@/application/queries/dashboardQueries";

interface Props {
  workspaceId: string;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-900/40 text-yellow-300",
  refined: "bg-green-900/40 text-green-300",
  failed: "bg-red-900/40 text-red-300",
};

// SRP: 이벤트 피드 목록과 페이지네이션만 담당
export function EventFeed({ workspaceId }: Props) {
  const [page, setPage] = useState(0);
  const limit = 10;
  const { data, isLoading } = useFeedQuery(workspaceId, page, limit);

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return (
    <div className="bg-zinc-900 rounded-xl p-5 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
        최근 AI 결정
      </h2>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-zinc-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data?.items.map((item) => (
            <div
              key={item.eventId}
              className="flex flex-col gap-1.5 p-3 bg-zinc-800 rounded-lg hover:bg-zinc-750 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-1 text-xs text-zinc-400 shrink-0">
                    <User size={12} />
                    {item.userEmail.split("@")[0]}
                  </div>
                  {item.projectName && (
                    <div className="flex items-center gap-1 text-xs text-zinc-500 shrink-0">
                      <Folder size={12} />
                      {item.projectName}
                    </div>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[item.status] ?? ""}`}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-sm text-zinc-200 line-clamp-2">{item.promptPreview}</p>
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock size={11} />
                {new Date(item.createdAt).toLocaleString("ko-KR")}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1.5 rounded-md disabled:opacity-30 hover:bg-zinc-700 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-zinc-400">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-1.5 rounded-md disabled:opacity-30 hover:bg-zinc-700 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
