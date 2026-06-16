import { TrendingUp, GitCommit, Layers, Zap, ArrowRight, BarChart3 } from "lucide-react";
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
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">
              기능
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
            <div className="mb-6 flex items-center gap-3">
              <span className="inline-block font-mono text-xs text-zinc-500 border border-zinc-800 bg-zinc-900/60 px-3 py-1 rounded-full tracking-widest uppercase">
                Norse Mythology
              </span>
              <span className="text-zinc-700 text-xs">×</span>
              <span className="inline-block font-mono text-xs text-violet-400 border border-violet-800 bg-violet-950/40 px-3 py-1 rounded-full">
                팀 AI 생산성 가시화
              </span>
            </div>

            <p className="font-mono text-xs text-zinc-600 mb-4 leading-relaxed max-w-lg">
              오딘의 까마귀 <span className="text-zinc-400">Huginn(생각)</span>은 매일 세상을 날며
              모든 것을 관찰하고 돌아와 귀띔한다.
            </p>

            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
              AI 많이 쓸 때
              <br />
              <span className="text-violet-400">팀이 정말</span>
              <br />
              <span className="text-zinc-300">더 빠른가?</span>
            </h1>

            <p className="text-base text-zinc-400 max-w-xl mb-8 leading-relaxed">
              커밋 속도와 AI 기여도를 함께 추적한다. 언제 AI가 팀 속도를 끌어올리는지,
              어떤 협업 패턴이 실제로 효과적인지 — 데이터로 답한다.
              <br /><br />
              <span className="text-zinc-200">git commit 마다 자동 수집. 프롬프트 공유 불필요. 팀 전체가 즉시 확인.</span>
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
                href="#features"
                className="inline-flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-medium px-5 py-2.5 rounded transition-colors"
              >
                기능 보기
              </a>
            </div>
          </div>

          {/* 로고 */}
          <div className="relative shrink-0 flex flex-col items-center gap-4">
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
            <div className="text-center">
              <p className="font-mono text-[10px] text-zinc-600 tracking-[0.3em] uppercase">Huginn · 생각</p>
              <p className="font-mono text-[10px] text-zinc-700 tracking-[0.2em]">Odin&apos;s Raven of Thought</p>
            </div>
          </div>
        </div>

        {/* 핵심 기능 미리보기 */}
        <div className="grid sm:grid-cols-3 gap-3 mt-16">
          {/* 팀 생산성 리듬 */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-3">팀 생산성 리듬</p>
            <div className="flex items-end gap-1 h-14 mb-1">
              {[3, 5, 2, 7, 6, 4, 8].map((h, i) => (
                <div key={i} className="flex-1">
                  <div
                    className="w-full rounded-sm bg-zinc-700"
                    style={{ height: `${(h / 8) * 56}px` }}
                  />
                </div>
              ))}
            </div>
            <svg viewBox="0 0 140 12" className="w-full mb-2" preserveAspectRatio="none">
              <polyline points="0,10 20,7 40,11 60,2 80,4 100,8 120,2 140,0" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-xs text-zinc-300 font-medium">커밋 속도 × AI 기여도</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">AI 기여 높은 날 평균 2.3× 커밋</p>
          </div>

          {/* Frame 협업 패턴 */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-3">AI 협업 패턴</p>
            <div className="flex flex-col gap-1.5 mb-3">
              {[
                { f: "A", pct: 12, color: "#38bdf8" },
                { f: "B", pct: 45, color: "#a78bfa" },
                { f: "C", pct: 35, color: "#34d399" },
                { f: "D", pct: 8,  color: "#fb923c" },
              ].map(({ f, pct, color }) => (
                <div key={f} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono w-4 shrink-0" style={{ color }}>{f}</span>
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-[10px] text-zinc-600 w-6 text-right">{pct}%</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-300 font-medium">Frame A/B/C/D 분포</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">결정 단위 역할 분리 분석</p>
          </div>

          {/* 캐시 전략 제안 */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-3">캐시 전략 제안</p>
            <div className="flex flex-col gap-1.5 mb-3">
              {[
                { domain: "DB",   priority: "긴급", cls: "text-red-400 bg-red-950/40 border-red-800/50",     count: 12 },
                { domain: "Auth", priority: "권장", cls: "text-amber-400 bg-amber-950/40 border-amber-800/50", count: 8  },
                { domain: "API",  priority: "참고", cls: "text-zinc-400 bg-zinc-800/60 border-zinc-700/50",   count: 6  },
              ].map(({ domain, priority, cls, count }) => (
                <div key={domain} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${cls}`}>{priority}</span>
                    <span className="text-[11px] text-zinc-400 font-mono">{domain}</span>
                  </div>
                  <span className="text-[10px] text-zinc-600">{count}회 반복</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-300 font-medium">CLAUDE.md 최적화 제안</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">반복 프롬프트 자동 감지</p>
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-8">
          Data pipeline
        </h2>

        <div className="grid sm:grid-cols-3 gap-0 mb-8">
          <div className="relative flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-l-xl p-5 sm:rounded-r-none">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-[10px] font-mono text-blue-400">1</span>
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">Collect</span>
            </div>
            <p className="text-sm font-medium text-zinc-200">커밋마다 자동 수집</p>
            <div className="flex flex-col gap-1.5 font-mono text-[11px]">
              {["prompt + response", "git diff", "branch", "commit hash"].map(f => (
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
                ["frame",   "A · B · C · D"],
                ["ai%",     "기여도 0–100"],
                ["무엇",    "구체 결과물"],
                ["왜",      "문제·맥락"],
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

          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-r-xl p-5 sm:rounded-l-none">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-mono text-emerald-400">3</span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Visualize</span>
            </div>
            <p className="text-sm font-medium text-zinc-200">팀 대시보드에 게시</p>
            <div className="flex flex-col gap-1.5 font-mono text-[11px]">
              {["팀 생산성 리듬 차트", "AI 협업 패턴 분포", "캐시 전략 제안", "결정 타임라인"].map(f => (
                <div key={f} className="flex items-center gap-1.5 text-zinc-500">
                  <span className="w-1 h-1 rounded-full bg-emerald-700 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-600 font-mono text-center">
          git commit → PII 마스킹 → PostgreSQL → Claude Haiku ETL → 팀 대시보드
        </p>
      </section>

      {/* Feature grid */}
      <section id="features" className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-8">
          Features
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-violet-800/30 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <TrendingUp size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">팀 생산성 리듬</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              커밋 속도와 AI 기여도를 같은 축에서 본다.
              AI를 많이 쓴 날 정말 더 많이 만들었는지, 데이터가 직접 답한다.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <Layers size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">AI 협업 패턴 (Frame A–D)</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Human-led · AI-assisted · AI-led · Automated — 결정마다 역할을 분리해서 추적.
              팀이 어떤 방식으로 AI를 쓰는지 패턴을 파악한다.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-amber-400">
              <Zap size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">캐시 전략 제안</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              반복 프롬프트 도메인을 자동 감지해 CLAUDE.md 최적화를 제안한다.
              토큰 낭비를 줄이고 AI 응답 품질을 높인다.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <GitCommit size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">결정 맥락 보존</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              diff, commit, 프롬프트, 이유가 함께 저장된다.
              "왜 이 코드가 이렇게 됐는지"를 나중에 정확히 추적.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <BarChart3 size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">팀원별 AI 활용 분석</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              팀원마다 어떤 Frame으로 AI를 쓰는지, 기여도 분포가 어떻게 다른지
              한눈에 비교한다.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-blue-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">결정 타임라인</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              팀이 오늘 AI와 함께 내린 모든 결정을 실시간으로 확인.
              프롬프트를 따로 공유하지 않아도 팀 전체가 볼 수 있다.
            </p>
          </div>
        </div>
      </section>

      {/* Frame A/B/C/D 설명 */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">
            Frame A / B / C / D
          </h2>
          <p className="text-sm text-zinc-500 mb-6">결정마다 인간과 AI의 역할을 4단계로 분류한다</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { f: "A", label: "Human-led",   who: "인간 주도", desc: "인간이 설계·결정, AI는 질문 답변 정도",     cls: "border-sky-700/40 bg-sky-900/20 text-sky-400" },
              { f: "B", label: "AI-assisted", who: "AI 보조",   desc: "AI가 초안·코드 제안, 인간이 검토·수정",   cls: "border-violet-700/40 bg-violet-900/20 text-violet-400" },
              { f: "C", label: "AI-led",      who: "AI 주도",   desc: "AI가 구현 대부분, 인간은 방향·검수",       cls: "border-emerald-700/40 bg-emerald-900/20 text-emerald-400" },
              { f: "D", label: "Automated",   who: "자동화",    desc: "AI가 독립 실행, 인간 개입 최소",            cls: "border-orange-700/40 bg-orange-900/20 text-orange-400" },
            ].map(({ f, label, who, desc, cls }) => (
              <div key={f} className={`rounded-lg border px-4 py-4 ${cls}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base font-bold font-mono">{f}</span>
                  <span className="text-xs opacity-70">{who}</span>
                </div>
                <p className="text-xs font-medium mb-1 opacity-90">{label}</p>
                <p className="text-[11px] opacity-60 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-800 bg-black">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            AI 쓸수록 팀이 더 빠른지, 직접 확인하세요
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
