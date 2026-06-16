"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Plus } from "lucide-react";
import { useWorkspacesQuery } from "@/application/queries/dashboardQueries";
import { useAuthStore } from "@/application/stores/authStore";
import { useWorkspaceStore } from "@/application/stores/workspaceStore";

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
    <aside className="w-52 shrink-0 flex flex-col bg-white border-r border-slate-200 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-100">
        <Link href="/" className="font-mono font-bold text-slate-900 text-sm tracking-tight">
          HUGININ
        </Link>
        <p className="text-[10px] text-slate-400 mt-0.5">AI Decision Workspace</p>
      </div>

      {/* Workspace list */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="px-3 mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Workspaces
          </span>
          <button
            title="새 워크스페이스"
            onClick={() => router.push("/workspace/new")}
            className="w-5 h-5 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>

        {isLoading ? (
          <div className="px-3 flex flex-col gap-1.5">
            {[1, 2].map((i) => (
              <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
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
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-violet-50 text-violet-700 font-medium"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <LayoutDashboard
                      size={13}
                      className={`shrink-0 ${isActive ? "text-violet-500" : "text-slate-400"}`}
                    />
                    <span className="truncate">{ws.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <LogOut size={12} />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
