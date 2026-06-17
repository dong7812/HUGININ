"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/application/stores/authStore";
import { useWorkspaceStore } from "@/application/stores/workspaceStore";
import { apiFetch } from "@/infrastructure/http/apiClient";
import { Loader2 } from "lucide-react";

function GoogleCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);

  useEffect(() => {
    const token = params.get("token");
    const userId = params.get("user_id");
    if (!token) { router.push("/login"); return; }

    setAuth(token, userId ?? "");
    apiFetch<Array<{ id: string; name: string }>>("/workspace", token)
      .then((ws) => {
        if (ws.length > 0) {
          setWorkspace(ws[0].id, ws[0].name);
          router.push(`/workspace/${ws[0].id}`);
        } else {
          router.push("/workspace/new");
        }
      })
      .catch(() => router.push("/workspace/new"));
  }, [params, setAuth, setWorkspace, router]);

  return (
    <div className="flex flex-col items-center gap-4">
      <Loader2 size={32} className="animate-spin text-blue-500" />
      <p className="text-sm text-neutral-500">Google 로그인 처리 중...</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Suspense fallback={<Loader2 size={32} className="animate-spin text-blue-500" />}>
        <GoogleCallbackContent />
      </Suspense>
    </div>
  );
}
