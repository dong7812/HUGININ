import { Eye, GitCommit, Search, Users, ArrowRight, BarChart3, Layers } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="border-b border-zinc-800/60 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/web-app-manifest-192x192.png"
              alt="HUGININ"
              width={28}
              height={28}
              className="invert opacity-90"
            />
            <span className="font-mono font-bold text-white tracking-tight text-base">HUGININ</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#how" className="text-sm text-zinc-400 hover:text-white transition-colors">
              How it works
            </a>
            <Link
              href="/login"
              className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded transition-colors"
            >
              시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-20">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-12">

          {/* 텍스트 */}
          <div className="flex-1">
            {/* 신화 뱃지 */}
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-block font-mono text-xs text-zinc-500 border border-zinc-800 bg-zinc-900/60 px-3 py-1 rounded-full tracking-widest uppercase">
                Norse Mythology
              </span>
              <span className="text-zinc-700 text-xs">×</span>
              <span className="inline-block font-mono text-xs text-violet-400 border border-violet-800 bg-violet-950/40 px-3 py-1 rounded-full">
                AI 협업 가시화
              </span>
            </div>

            {/* 오딘 설명 */}
            <p className="font-mono text-xs text-zinc-600 mb-4 leading-relaxed max-w-lg">
              오딘의 까마귀 <span className="text-zinc-400">Huginn(생각)</span>은 매일 세상을 날며
              모든 것을 관찰하고 돌아와 귀띔한다.
            </p>

            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
              팀의 AI 협업을
              <br />
              <span className="text-violet-400">관찰하고</span>
              <br />
              <span className="text-zinc-300">가져온다</span>
            </h1>

            <p className="text-base text-zinc-400 max-w-xl mb-8 leading-relaxed">
              프롬프트는 공유되지 않는다. 누가 AI에게 뭘 물어봤는지, 어떤 결정이 AI 기반인지,
              팀이 비슷한 시도를 중복으로 하고 있는지 — 팀에서 아무도 모른다.
              <br /><br />
              <span className="text-zinc-200">HUGININ이 Huginn처럼, 팀의 모든 AI 협업을 관찰하고 타임라인으로 가져온다.</span>
            </p>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium px-5 py-2.5 rounded transition-colors"
              >
                무료로 시작하기
                <ArrowRight size={16} />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-medium px-5 py-2.5 rounded transition-colors"
              >
                작동 방식
              </a>
            </div>
          </div>

          {/* 로고 */}
          <div className="relative shrink-0 flex flex-col items-center gap-4">
            {/* 글로우 */}
            <div className="absolute inset-0 rounded-full bg-violet-600/10 blur-3xl scale-150 pointer-events-none" />
            <div className="relative">
              <Image
                src="/web-app-manifest-512x512.png"
                alt="HUGININ — Huginn, Odin's raven"
                width={220}
                height={220}
                className="invert opacity-90 drop-shadow-[0_0_40px_rgba(139,92,246,0.3)]"
                priority
              />
            </div>
            {/* 룬 문자 느낌의 캡션 */}
            <div className="text-center">
              <p className="font-mono text-[10px] text-zinc-600 tracking-[0.3em] uppercase">Huginn · 생각</p>
              <p className="font-mono text-[10px] text-zinc-700 tracking-[0.2em]">Odin's Raven of Thought</p>
            </div>
          </div>
        </div>

        {/* Before / After */}
        <div className="grid sm:grid-cols-2 gap-3 mt-16 max-w-2xl">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-xs">
            <div className="text-zinc-600 mb-3">// Huginn 없이</div>
            <div className="space-y-2 text-zinc-500">
              <div>팀원 A: <span className="text-zinc-400">git commit "notification"</span></div>
              <div>팀원 B: <span className="text-zinc-400">git commit "notification"</span></div>
              <div className="text-zinc-700 pt-1">← 같은 시도, 서로 모름</div>
              <div className="pt-1">팀원 C: <span className="text-zinc-400">"이거 왜 이렇게 됐어?"</span></div>
              <div className="text-zinc-700">← 결정 맥락 없음</div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-violet-900/50 rounded-lg p-4 font-mono text-xs">
            <div className="text-violet-600 mb-3">// Huginn이 보고 온 것</div>
            <div className="space-y-2">
              <div className="text-zinc-300">팀원 A <span className="text-zinc-600">10:23</span></div>
              <div className="text-zinc-500 pl-2">WebSocket → SSE 전환</div>
              <div className="text-zinc-600 pl-2 text-xs">AI가 연결 관리 복잡성 지적</div>
              <div className="pt-1 text-zinc-300">팀원 B <span className="text-zinc-600">11:45</span></div>
              <div className="text-emerald-600 pl-2 text-xs">↳ A의 작업 참조 → 중복 방지</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline — 추상 플로우 */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-8">
          Data pipeline
        </h2>

        {/* 3단 플로우 */}
        <div className="grid sm:grid-cols-3 gap-0 mb-8">
          {/* ① Collect */}
          <div className="relative flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-l-xl p-5 sm:rounded-r-none">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-[10px] font-mono text-blue-400">1</span>
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Collect</span>
            </div>
            <p className="text-sm font-medium text-zinc-200">커밋마다 자동 수집</p>
            <div className="flex flex-col gap-1.5 font-mono text-[11px]">
              {["prompt", "AI response", "git diff", "branch", "user"].map(f => (
                <div key={f} className="flex items-center gap-1.5 text-zinc-500">
                  <span className="w-1 h-1 rounded-full bg-zinc-700 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 hidden sm:flex w-6 h-6 rounded-full bg-zinc-950 border border-zinc-700 items-center justify-center text-zinc-500">
              <ArrowRight size={12} />
            </div>
          </div>

          {/* ② Analyze */}
          <div className="relative flex flex-col gap-3 bg-violet-950/30 border-y border-violet-900/50 p-5 sm:border-x-0 border sm:border-t border-b border-zinc-800 sm:rounded-none rounded-none">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-[10px] font-mono text-violet-400">2</span>
              <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest">Analyze</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-200">AI가 의미를 추출</p>
              <span className="text-[9px] font-mono text-violet-500 bg-violet-950/60 border border-violet-800/50 px-1.5 py-0.5 rounded">Claude Haiku</span>
            </div>
            <div className="flex flex-col gap-1.5 font-mono text-[11px]">
              {[
                ["frame",    "A · B · C · D"],
                ["ai%",      "기여도 0–100"],
                ["무엇",      "구체 결과물"],
                ["왜",        "문제·맥락"],
                ["AI 역할",  "누가 무엇을"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-2 text-zinc-500">
                  <span className="text-violet-400/80">{k}</span>
                  <span className="text-zinc-600">{v}</span>
                </div>
              ))}
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 hidden sm:flex w-6 h-6 rounded-full bg-zinc-950 border border-zinc-700 items-center justify-center text-zinc-500">
              <ArrowRight size={12} />
            </div>
          </div>

          {/* ③ Visualize */}
          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-r-xl p-5 sm:rounded-l-none">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-mono text-emerald-400">3</span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Visualize</span>
            </div>
            <p className="text-sm font-medium text-zinc-200">팀 타임라인에 게시</p>
            {/* 미니 카드 미리보기 */}
            <div className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2.5 flex flex-col gap-2">
              <p className="text-[11px] text-zinc-200 font-medium leading-snug">Redis pub/sub → SSE 전환 결정</p>
              <p className="text-[10px] text-zinc-600 leading-snug">연결 관리 복잡성 → 단방향 알림으로 충분</p>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[9px] font-mono text-violet-400 bg-violet-950/40 border border-violet-800/40 px-1.5 py-0.5 rounded">C · AI 주도</span>
                <span className="text-[9px] font-mono text-zinc-600">AI 82%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 서브텍스트 */}
        <p className="text-xs text-zinc-600 font-mono text-center">
          git commit → PII 마스킹 → PostgreSQL + pgvector → Claude Haiku ETL → 팀 피드
        </p>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-8">
          How it works
        </h2>

        <div className="grid gap-4">
          {/* Step 1 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono text-violet-500 bg-violet-950/40 border border-violet-900 px-2 py-0.5 rounded">
                Step 1
              </span>
              <span className="text-sm font-medium text-zinc-200">
                Git hook 설치 — <span className="text-zinc-400 font-normal">커밋마다 자동 수집</span>
              </span>
            </div>
            <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
              <span className="text-green-400">$</span>
              <span className="text-zinc-200">{" git commit -m \"feat: add notification system\""}</span>
              {"\n"}
              <span className="text-zinc-600">{"[huginin] "}</span>
              <span className="text-zinc-400">prompt + response + diff + branch 수집</span>
              {"\n"}
              <span className="text-zinc-600">{"[huginin] "}</span>
              <span className="text-zinc-400">AI 기여도 분석 중...</span>
              {"\n"}
              <span className="text-zinc-600">{"[huginin] "}</span>
              <span className="text-emerald-400">팀 워크스페이스에 게시됨</span>
            </pre>
            <p className="text-xs text-zinc-600 mt-2 font-mono">
              → 프롬프트를 따로 공유하지 않아도 팀이 볼 수 있다
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono text-violet-500 bg-violet-950/40 border border-violet-900 px-2 py-0.5 rounded">
                Step 2
              </span>
              <span className="text-sm font-medium text-zinc-200">
                팀 타임라인 — 누가 어떤 결정을 AI와 함께 내렸는지
              </span>
            </div>
            <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
              <span className="text-zinc-500">{"─── 오늘 ──────────────────────────────────"}</span>
              {"\n"}
              <span className="text-zinc-300">{"kim@team  "}</span>
              <span className="text-zinc-500">{"feat/notification  "}</span>
              <span className="text-zinc-600">{"14:32"}</span>
              {"\n"}
              <span className="text-zinc-500">{"  └ "}</span>
              <span className="text-zinc-400">{"WebSocket → SSE 전환 결정"}</span>
              {"\n"}
              <span className="text-zinc-600">{"    AI: 구조 제안  |  개발자: 방향 결정  |  AI: 엣지케이스 발견"}</span>
              {"\n\n"}
              <span className="text-zinc-300">{"lee@team  "}</span>
              <span className="text-zinc-500">{"feat/auth  "}</span>
              <span className="text-zinc-600">{"11:15"}</span>
              {"\n"}
              <span className="text-zinc-500">{"  └ "}</span>
              <span className="text-zinc-400">{"JWT refresh token 전략"}</span>
              {"\n"}
              <span className="text-zinc-600">{"    개발자: 주도  |  AI: 구현 생성"}</span>
            </pre>
          </div>

          {/* Step 3 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono text-violet-500 bg-violet-950/40 border border-violet-900 px-2 py-0.5 rounded">
                Step 3
              </span>
              <span className="text-sm font-medium text-zinc-200">
                MCP 연결 — Claude가 구현 전 팀 이력 자동 참조
              </span>
            </div>
            <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
              <span className="text-zinc-400">You: </span>
              <span className="text-zinc-200">알림 시스템 WebSocket으로 만들어줘</span>
              {"\n\n"}
              <span className="text-zinc-600">{"[huginin.recall_decisions] "}</span>
              <span className="text-zinc-500">팀 이력 확인 중...</span>
              {"\n"}
              <span className="text-emerald-500">{"  ✓ "}</span>
              <span className="text-zinc-400">3일 전 kim이 같은 시도 → 연결 관리 복잡성으로 SSE 전환</span>
              {"\n\n"}
              <span className="text-zinc-400">Claude: </span>
              <span className="text-zinc-200">팀 이력 기반으로 SSE로 구현하겠습니다.</span>
            </pre>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-8">
          Features
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <Eye size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">팀 AI 타임라인</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              누가, 언제, 어떤 결정을 AI와 함께 내렸는지 한눈에.
              프롬프트를 따로 공유하지 않아도 팀 전체가 볼 수 있다.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <Layers size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">AI 기여도 분석</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              이 결정에서 개발자가 주도했나, AI가 주도했나.
              구조 제안 / 구현 생성 / 엣지케이스 발견 — 역할을 분리해서 보여준다.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <GitCommit size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">결정 맥락 보존</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              diff, commit, 대화가 함께 저장된다.
              "왜 이 코드가 이렇게 됐는지"를 나중에 정확히 추적.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <Search size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">결정 검색</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              "Redis 관련 결정 전부" "인증 방식 바꾼 이유" — 자연어로 팀의
              과거 판단을 찾는다. 키워드가 달라도 의미로 검색.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <Users size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">팀 리뷰</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              각 AI 결정에 팀원이 코멘트로 검토.
              "이 방향 맞아?" 라는 질문이 결정 옆에 남는다.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <BarChart3 size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">팀 단위 AI 사용 분석</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              브랜치별, 팀원별 AI 활용 패턴.
              어디서 AI 의존도가 높고 어디서 낮은지 정량화.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6">
            기존 방식과의 차이
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-zinc-800">
                  <th className="pb-3 text-zinc-500 font-normal w-1/4"></th>
                  <th className="pb-3 text-zinc-500 font-mono font-normal">MD 파일 공유</th>
                  <th className="pb-3 text-zinc-500 font-mono font-normal">Git AI</th>
                  <th className="pb-3 text-violet-400 font-mono font-normal">HUGININ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                <tr>
                  <td className="py-3 text-zinc-500">수집 방식</td>
                  <td className="py-3 text-zinc-400">직접 작성</td>
                  <td className="py-3 text-zinc-400">코드 라인 귀속</td>
                  <td className="py-3 text-zinc-200">Git hook 자동 수집</td>
                </tr>
                <tr>
                  <td className="py-3 text-zinc-500">무엇을 저장</td>
                  <td className="py-3 text-zinc-400">정리된 요약</td>
                  <td className="py-3 text-zinc-400">AI 생성 코드 라인</td>
                  <td className="py-3 text-zinc-200">프롬프트 + 응답 + diff + 맥락</td>
                </tr>
                <tr>
                  <td className="py-3 text-zinc-500">AI 기여도</td>
                  <td className="py-3 text-zinc-400">없음</td>
                  <td className="py-3 text-zinc-400">라인 수준 귀속만</td>
                  <td className="py-3 text-zinc-200">결정 단위 역할 분석</td>
                </tr>
                <tr>
                  <td className="py-3 text-zinc-500">팀 가시화</td>
                  <td className="py-3 text-zinc-400">수동 공유</td>
                  <td className="py-3 text-zinc-400">불가 (로컬 저장)</td>
                  <td className="py-3 text-zinc-200">실시간 팀 타임라인</td>
                </tr>
                <tr>
                  <td className="py-3 text-zinc-500">AI 능동 참조</td>
                  <td className="py-3 text-zinc-400">없음</td>
                  <td className="py-3 text-zinc-400">없음</td>
                  <td className="py-3 text-zinc-200">MCP로 구현 전 자동 확인</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-800 bg-black">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            팀의 AI 협업을 가시화하세요
          </h2>
          <p className="text-zinc-500 mb-8 text-sm">
            Git hook 설치 1분 · 프롬프트 공유 불필요 · 팀 즉시 확인
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-3 rounded transition-colors"
          >
            무료로 시작하기
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-600 font-mono">
          <span>HUGININ</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}
