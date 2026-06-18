"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/application/stores/authStore";
import { useWorkspaceStore } from "@/application/stores/workspaceStore";
import { apiFetch } from "@/infrastructure/http/apiClient";

export function StartButton({ className, children }: { className: string; children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);

  async function handleClick() {
    if (!token) {
      router.push("/login");
      return;
    }
    if (workspaceId) {
      router.push(`/workspace/${workspaceId}`);
      return;
    }
    try {
      const ws = await apiFetch<Array<{ id: string; name: string }>>("/workspace", token);
      if (ws.length > 0) {
        setWorkspace(ws[0].id, ws[0].name);
        router.push(`/workspace/${ws[0].id}`);
      } else {
        router.push("/workspace/new");
      }
    } catch {
      router.push("/login");
    }
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
