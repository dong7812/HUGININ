"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Plus, ChevronRight } from "lucide-react";
import { useWorkspacesQuery } from "@/application/queries/dashboardQueries";
import { useAuthStore } from "@/application/stores/authStore";
import { useWorkspaceStore } from "@/application/stores/workspaceStore";

// SRP: 워크스페이스 목록 표시 + 선택 + 로그아웃만 담당
export function Sidebar() {
  const params = useParams();
  const router = useRouter();
  const activeId = params?.id as string | undefined;

  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const { data: workspaces, isLoading } = useWorkspacesQuery();

  function handleLogout() {
    clearAuth();
    router.push("/login");
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-zinc-900 border-r border-zinc-800 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-zinc-800">
        <Link href="/" className="font-mono font-bold text-white text-base tracking-tight">
          HUGININ
        </Link>
        <p className="text-[10px] text-zinc-500 mt-0.5">AI Decision Workspace</p>
      </div>

      {/* Workspace list */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Workspaces
          </span>
          <button
            title="새 워크스페이스"
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>

        {isLoading ? (
          <div className="px-3 flex flex-col gap-1.5">
            {[1, 2].map((i) => (
              <div key={i} className="h-8 bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5 px-2">
            {workspaces?.map((ws) => {
              const isActive = ws.id === activeId;
              return (
                <li key={ws.id}>
                  <Link
                    href={`/workspace/${ws.id}`}
                    onClick={() => setWorkspace(ws.id, ws.name)}
                    className={`flex items-center justify-between px-2 py-2 rounded-md text-sm transition-colors group ${
                      isActive
                        ? "bg-violet-600/20 text-violet-300"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <LayoutDashboard size={14} className="shrink-0" />
                      <span className="truncate">{ws.name}</span>
                    </div>
                    {isActive && <ChevronRight size={13} className="shrink-0" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <LogOut size={13} />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
