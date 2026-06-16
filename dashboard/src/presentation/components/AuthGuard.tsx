"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/application/stores/authStore";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [hydrated, setHydrated] = useState(false);

  // Zustand persist는 첫 렌더 이후 localStorage에서 복원됨
  // 복원 전에 token: null로 로그인 페이지로 보내는 문제 방지
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [hydrated, token, router]);

  if (!hydrated) return null;
  if (!token) return null;
  return <>{children}</>;
}
