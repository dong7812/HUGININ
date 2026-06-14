import { Sidebar } from "@/presentation/components/Sidebar";
import { AuthGuard } from "@/presentation/components/AuthGuard";

// 워크스페이스 공통 레이아웃 — 사이드바 + 메인 콘텐츠
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}
