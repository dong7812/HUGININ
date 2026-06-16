import { GitCommit, Layers, Zap, ArrowRight, BarChart3, BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { InstallSlider } from "./InstallSlider";

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
            <a href="#install" className="text-sm text-zinc-400 hover:text-white transition-colors">
              설치
            </a>
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

          <div className="flex-1">
            {/* Claude Code 전용 배지 */}
            <div className="mb-6 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-amber-400 border border-amber-800/60 bg-amber-950/30 px-3 py-1 rounded-full">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                Claude Code 전용
              </span>
              <span className="text-zinc-700 text-xs">—</span>
              <span className="text-xs text-zinc-500">다른 AI 도구 지원은 추후 예정</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
              AI로 빠르게 만든다.
              <br />
              <span className="text-zinc-500">왜 그렇게 만들었는지</span>
              <br />
              <span className="text-violet-400">기억하나?</span>
            </h1>

            <p className="text-base text-zinc-400 max-w-xl mb-4 leading-relaxed">
              Claude Code로 빠르게 만들수록 결정의 이유가 커밋 메시지 뒤에 묻힌다.
              3주 뒤 같은 코드를 보며 "왜 이렇게 했지?"를 반복한다.
            </p>
            <p className="text-base text-zinc-200 max-w-xl mb-8 leading-relaxed">
              HUGININ은 git commit마다 <span className="text-violet-400">무엇을 만들었고 왜 그렇게 결정했는지</span>를
              Claude Code 세션에서 자동으로 기록한다.
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
                href="#install"
                className="inline-flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-medium px-5 py-2.5 rounded transition-colors"
              >
                설치 방법
              </a>
            </div>

            <p className="text-xs text-zinc-600 mt-4 font-mono">
              git hook 설치 1분 · 별도 입력 없음 · 개인도, 팀도 무료
            </p>
          </div>

          {/* 로고 */}
          <div className="relative shrink-0 flex flex-col items-center gap-4">
            <div className="absolute inset-0 rounded-full bg-violet-600/10 blur-3xl scale-150 pointer-events-none" />
            <div className="relative">
              <Image
                src="/web-app-manifest-512x512.png"
                alt="HUGININ — Huginn, Odin's raven"
                width={200}
                height={200}
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

        {/* Before / After */}
        <div className="grid sm:grid-cols-2 gap-3 mt-16 max-w-2xl">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Without</span>
            <div className="font-mono text-[11px] flex flex-col gap-2">
              <div className="text-zinc-700">git commit -m &quot;refactor: simplify auth&quot;</div>
              <div className="text-zinc-700">git commit -m &quot;feat: add retry logic&quot;</div>
              <div className="text-zinc-700">git commit -m &quot;fix: edge case&quot;</div>
            </div>
            <div className="h-px bg-zinc-800" />
            <div className="bg-zinc-800/60 rounded-lg p-3">
              <p className="text-[11px] text-zinc-500 italic leading-relaxed">
                "3주 뒤: 왜 auth를 이렇게 바꿨지?<br />
                Claude한테 또 물어봐야겠다..."
              </p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-violet-800/40 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800 bg-zinc-800/30">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span className="text-[10px] font-mono text-zinc-400">feat/auth</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-700">자동 기록됨</span>
            </div>
            <div className="px-3.5 py-3 flex flex-col gap-2">
              <p className="text-xs text-zinc-200 font-medium leading-snug">
                JWT refresh token 전략 채택
              </p>
              <div className="flex gap-2">
                <span className="text-[9px] text-violet-400/60 font-mono w-4 shrink-0">왜</span>
                <span className="text-[10px] text-zinc-500 leading-tight">OAuth 세션 만료로 UX 깨짐 → 자동 갱신 필요</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[9px] text-emerald-400/60 font-mono w-4 shrink-0">뭘</span>
                <span className="text-[10px] text-zinc-500 leading-tight">refresh token rotation + silent renewal 구현</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[9px] font-mono text-violet-400 bg-violet-950/50 border border-violet-800/50 px-1.5 py-0.5 rounded">B · AI 보조</span>
                <div className="flex items-center gap-1">
                  <div className="h-1 w-12 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full w-[68%] rounded-full bg-violet-500" />
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600">68%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 설치 슬라이더 */}
      <section id="install" className="max-w-5xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              Quick start
            </h2>
            <p className="text-sm text-zinc-400 mt-1">설치부터 첫 수집까지 4단계, 약 1분</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-amber-400 border border-amber-800/50 bg-amber-950/20 px-2.5 py-1 rounded-full">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
            Claude Code 필요
          </span>
        </div>

        <InstallSlider />
      </section>

      {/* Feature grid */}
      <section id="features" className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-8">
          Features
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-violet-800/30 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <BookOpen size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">결정 맥락 자동 보존</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              커밋마다 왜 그 결정을 내렸는지 자동으로 기록한다.
              나중에 "이게 왜 이렇게 됐지?"를 Claude한테 다시 물어볼 필요가 없다.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <Layers size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">AI 협업 패턴 (Frame A–D)</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Human-led · AI-assisted · AI-led · Automated —
              이 결정에서 내가 주도했는지 AI가 주도했는지 자동으로 분류된다.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-amber-400">
              <Zap size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">캐시 전략 제안</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              같은 도메인 프롬프트를 반복하고 있으면 감지해서
              CLAUDE.md 최적화를 제안한다. 토큰과 시간을 아낀다.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <BarChart3 size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">팀 생산성 리듬</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              팀이 있다면: 커밋 속도와 AI 기여도를 함께 추적한다.
              Claude Code를 많이 쓴 날 실제로 더 빠른지 데이터로 확인한다.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <GitCommit size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">결정 검색</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              "Redis 관련 결정 전부" "인증 방식 바꾼 이유" — 키워드가 달라도
              의미로 과거 판단을 찾는다.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-blue-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">MCP 자동 참조</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Claude가 구현 전 과거 결정을 자동으로 확인한다.
              "3일 전 같은 시도 → SSE로 전환했음"을 먼저 알려준다.
            </p>
          </div>
        </div>
      </section>

      {/* Frame 설명 */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">
            Frame A / B / C / D
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            결정마다 인간과 AI의 역할을 4단계로 자동 분류한다
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { f: "A", label: "Human-led",   who: "인간 주도", desc: "인간이 설계·결정, AI는 질문 답변 정도",    cls: "border-sky-700/40 bg-sky-900/20 text-sky-400" },
              { f: "B", label: "AI-assisted", who: "AI 보조",   desc: "AI가 초안·코드 제안, 인간이 검토·수정",  cls: "border-violet-700/40 bg-violet-900/20 text-violet-400" },
              { f: "C", label: "AI-led",      who: "AI 주도",   desc: "AI가 구현 대부분, 인간은 방향·검수",      cls: "border-emerald-700/40 bg-emerald-900/20 text-emerald-400" },
              { f: "D", label: "Automated",   who: "자동화",    desc: "AI가 독립 실행, 인간 개입 최소",           cls: "border-orange-700/40 bg-orange-900/20 text-orange-400" },
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
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-amber-400 border border-amber-800/50 bg-amber-950/20 px-2.5 py-1 rounded-full mb-4">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
            Claude Code 사용자 전용
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 mt-2">
            AI 쓰면서 까먹는 why,<br />이제 자동으로 남긴다
          </h2>
          <p className="text-zinc-500 mb-8 text-sm">
            git hook 설치 1분 · 별도 입력 없음 · 개인도, 팀도 무료
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
