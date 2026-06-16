"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/application/stores/authStore";
import { useWorkspaceStore } from "@/application/stores/workspaceStore";
import { apiFetch } from "@/infrastructure/http/apiClient";
import { Loader2, Plus } from "lucide-react";

export default function NewWorkspacePage() {
  const router = useRouter();
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
          <h1 className="text-xl font-bold text-white">새 워크스페이스</h1>
          <p className="text-sm text-zinc-400">팀 이름을 입력하세요</p>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400">워크스페이스 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="예: AURA Team"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-600"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            만들기
          </button>
        </form>
      </div>
    </div>
  );
}
