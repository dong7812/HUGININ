"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/application/stores/authStore";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";

function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [state, setState] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");
    const userId = params.get("user_id");

    if (error) {
      setState("error");
      return;
    }
    if (token) {
      setAuth(token, userId ?? "");
      setState("success");
      setTimeout(() => router.push("/workspace/new"), 2000);
      return;
    }
    setState("error");
  }, [params, setAuth, router]);

  if (state === "loading") return (
    <div className="flex flex-col items-center gap-4">
      <Loader2 size={32} className="animate-spin text-blue-500" />
      <p className="text-sm text-neutral-500">인증 확인 중...</p>
    </div>
  );

  if (state === "success") return (
    <div className="flex flex-col items-center gap-4 text-center">
      <CheckCircle size={40} className="text-emerald-500" />
      <div>
        <h2 className="text-lg font-bold text-neutral-900 mb-1">이메일 인증 완료!</h2>
        <p className="text-sm text-neutral-500">잠시 후 대시보드로 이동합니다</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <XCircle size={40} className="text-red-500" />
      <div>
        <h2 className="text-lg font-bold text-neutral-900 mb-1">인증 링크가 유효하지 않습니다</h2>
        <p className="text-sm text-neutral-500">링크가 만료됐거나 이미 사용된 링크입니다</p>
      </div>
      <button
        onClick={() => router.push("/login")}
        className="text-sm text-blue-600 hover:underline"
      >
        로그인으로 돌아가기
      </button>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Suspense fallback={<Loader2 size={32} className="animate-spin text-blue-500" />}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
