"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/application/stores/authStore";
import { useWorkspaceStore } from "@/application/stores/workspaceStore";
import { apiFetch } from "@/infrastructure/http/apiClient";

export function LandingAuthGuard() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);

  useEffect(() => {
    if (!token) return;
    if (workspaceId) {
      router.replace(`/workspace/${workspaceId}`);
      return;
    }
    apiFetch<Array<{ id: string; name: string }>>("/workspace", token)
      .then((ws) => {
        if (ws.length > 0) {
          setWorkspace(ws[0].id, ws[0].name);
          router.replace(`/workspace/${ws[0].id}`);
        } else {
          router.replace("/workspace/new");
        }
      })
      .catch(() => {});
  }, [token, workspaceId, router, setWorkspace]);

  return null;
}
