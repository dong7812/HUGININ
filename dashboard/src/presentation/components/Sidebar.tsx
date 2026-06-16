"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LogOut, Plus } from "lucide-react";
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
    <aside className="w-52 shrink-0 flex flex-col bg-white border-r border-neutral-100 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link href="/" className="font-mono font-bold text-neutral-900 text-sm tracking-widest uppercase">
          HUGININ
        </Link>
      </div>

      {/* Workspace list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
            Workspaces
          </span>
          <button
            title="새 워크스페이스"
            onClick={() => router.push("/workspace/new")}
            className="w-5 h-5 flex items-center justify-center rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-1">
            {[1, 2].map((i) => (
              <div key={i} className="h-8 bg-neutral-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {workspaces?.map((ws) => {
              const isActive = ws.id === activeId;
              return (
                <li key={ws.id}>
                  <Link
                    href={`/workspace/${ws.id}`}
                    onClick={() => setWorkspace(ws.id, ws.name)}
                    className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-blue-600 text-white font-medium"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-blue-200" : "bg-neutral-300"}`} />
                    <span className="truncate">{ws.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-neutral-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <LogOut size={12} />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
