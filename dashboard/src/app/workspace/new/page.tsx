"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/application/stores/authStore";
import { useWorkspaceStore } from "@/application/stores/workspaceStore";
import { apiFetch } from "@/infrastructure/http/apiClient";
import { Loader2, Plus } from "lucide-react";

export default function NewWorkspacePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);

  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { router.push("/login"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch<{ workspace_id: string; slug: string }>(
        "/workspace",
        token,
        { method: "POST", body: JSON.stringify({ name }) }
      );
      setWorkspace(res.workspace_id, name);
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      router.push(`/workspace/${res.workspace_id}`);
    } catch {
      setError("워크스페이스 생성에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="flex flex-col gap-8 w-full max-w-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-900">새 워크스페이스</h1>
          <p className="text-sm text-slate-500">팀 이름을 입력하세요</p>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600">워크스페이스 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="예: AURA Team"
              className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all shadow-sm"
            />
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            만들기
          </button>
        </form>
      </div>
    </div>
  );
}
