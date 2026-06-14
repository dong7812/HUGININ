"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/application/stores/authStore";

// SRP: 인증 여부 확인 + 미인증 시 리다이렉트만 담당
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  if (!token) return null;
  return <>{children}</>;
}
