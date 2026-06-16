import { LoginForm } from "@/presentation/components/LoginForm";

// 얇은 페이지 레이어 — UI 로직은 LoginForm이 담당
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">HUGININ</h1>
          <p className="text-sm text-slate-500">팀 AI 의사결정 워크스페이스</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
