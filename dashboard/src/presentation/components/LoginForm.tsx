"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/application/stores/authStore";
import { useWorkspaceStore } from "@/application/stores/workspaceStore";
import { apiLogin, apiFetch } from "@/infrastructure/http/apiClient";
import { LogIn, Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const token = await apiLogin(email, password);
      setAuth(token, email);

      const ws = await apiFetch<Array<{ id: string; name: string }>>("/workspace", token);
      if (ws.length > 0) {
        setWorkspace(ws[0].id, ws[0].name);
        router.push(`/workspace/${ws[0].id}`);
      } else {
        router.push("/workspace/new");
      }
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-neutral-600">이메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="team@company.com"
          className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-neutral-600">비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-white border border-neutral-200 rounded-xl px-3 py-2.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
        로그인
      </button>
    </form>
  );
}
