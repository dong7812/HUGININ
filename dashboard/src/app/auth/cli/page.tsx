"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/application/stores/authStore";
import { apiCliAuthorize } from "@/infrastructure/http/apiClient";
import { CheckCircle, Loader2, Terminal, LogIn } from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function CliAuthContent() {
  const params = useSearchParams();
  const sessionId = params.get("session");
  const done = params.get("done");

  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.email); // email as userId identifier

  const [state, setState] = useState<"idle" | "authorizing" | "done" | "error">(
    done ? "done" : "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (done === "1") { setState("done"); return; }
    if (!sessionId || !token) return;

    // 이미 로그인된 상태면 자동으로 승인
    async function autoAuthorize() {
      setState("authorizing");
      try {
        await apiCliAuthorize(sessionId!, token!, userId ?? "", token!);
        setState("done");
      } catch (e) {
        setState("error");
        setErrorMsg(e instanceof Error ? e.message : "승인 실패");
      }
    }
    autoAuthorize();
  }, [sessionId, token, userId, done]);

  if (!sessionId) return (
    <div className="text-center">
      <p className="text-sm text-neutral-500">유효하지 않은 링크입니다</p>
    </div>
  );

  if (!token && state === "idle") return (
    <div className="flex flex-col items-center gap-6 text-center max-w-sm">
      <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center">
        <Terminal size={24} className="text-white" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">CLI 로그인 승인</h2>
        <p className="text-sm text-neutral-500 leading-relaxed">
          HUGININ CLI가 로그인을 요청했습니다.<br />
          먼저 계정에 로그인하세요.
        </p>
      </div>
      <Link
        href={`/login?redirect=/auth/cli?session=${sessionId}`}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
      >
        <LogIn size={16} />
        로그인하고 승인
      </Link>
      <p className="text-xs text-neutral-400">
        또는{" "}
        <a href={`${API_BASE}/auth/google?state=cli_${sessionId}`} className="text-blue-600 hover:underline">
          Google로 승인
        </a>
      </p>
    </div>
  );

  if (state === "authorizing") return (
    <div className="flex flex-col items-center gap-4">
      <Loader2 size={32} className="animate-spin text-blue-500" />
      <p className="text-sm text-neutral-500">CLI 로그인 승인 중...</p>
    </div>
  );

  if (state === "done") return (
    <div className="flex flex-col items-center gap-6 text-center max-w-sm">
      <CheckCircle size={48} className="text-emerald-500" />
      <div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">CLI 로그인 완료</h2>
        <p className="text-sm text-neutral-500 leading-relaxed">
          터미널로 돌아가세요.<br />
          이 창은 닫아도 됩니다.
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm text-red-500 font-medium">{errorMsg || "승인 중 오류가 발생했습니다"}</p>
      <button
        onClick={() => setState("idle")}
        className="text-xs text-blue-600 hover:underline"
      >
        다시 시도
      </button>
    </div>
  );
}

export default function CliAuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Suspense fallback={<Loader2 size={32} className="animate-spin text-blue-500" />}>
        <CliAuthContent />
      </Suspense>
    </div>
  );
}
