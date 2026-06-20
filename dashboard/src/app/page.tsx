import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { InstallSlider } from "./InstallSlider";
import { StartButton } from "./StartButton";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/web-app-manifest-192x192.png" alt="HUGININ" width={40} height={40} className="opacity-80" />
            <span className="font-mono font-bold text-neutral-900 tracking-widest text-sm uppercase">HUGININ</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#how" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">설치</a>
            <a href="#features" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">기능</a>
            <StartButton className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              시작하기
            </StartButton>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center mb-10">
            <Image
              src="/web-app-manifest-512x512.png"
              alt="Huginn — Odin's Raven of Thought"
              width={120}
              height={120}
              className="opacity-85 mb-4"
              priority
            />
            <p className="font-mono text-[10px] text-neutral-400 tracking-[0.25em] uppercase">Huginn · 생각 · Odin&apos;s Raven</p>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600 mb-6">
            AI 의사결정 버전 관리
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-neutral-900 leading-[1.05] tracking-tight mb-8">
            Git이 코드 이력을
            <br />
            <span className="text-neutral-400">남기듯,</span>
            <br />
            AI 결정 이력을 남긴다.
          </h1>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto leading-relaxed mb-4">
            Claude Code 세션마다 <span className="text-neutral-900 font-medium">무엇을, 왜, 어떻게 결정했는지</span>가
            커밋과 함께 자동으로 쌓인다.
          </p>
          <p className="text-base text-neutral-400 max-w-xl mx-auto leading-relaxed mb-10">
            지금 쌓지 않으면 6개월 뒤에도 없다.
          </p>
          <div className="flex items-center justify-center gap-3">
            <StartButton className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-sm">
              무료로 시작하기
              <ArrowRight size={16} />
            </StartButton>
            <a href="#how"
              className="inline-flex items-center gap-2 border border-neutral-200 hover:border-neutral-400 text-neutral-700 font-medium px-7 py-3.5 rounded-xl transition-colors text-sm">
              설치 방법
            </a>
          </div>
          <p className="text-xs text-neutral-400 mt-5 font-mono">git hook 설치 1분 · 별도 입력 없음 · 무료</p>
        </div>
      </section>

      {/* Git analogy */}
      <section className="bg-[#f5f4ef] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3 text-center">Why HUGININ</p>
          <h2 className="text-3xl font-bold text-neutral-900 text-center mb-4 tracking-tight">
            코드 이력은 Git이 관리한다.
            <br />AI 결정 이력은?
          </h2>
          <p className="text-sm text-neutral-500 text-center mb-14 max-w-xl mx-auto">
            커밋 diff는 무엇이 바뀌었는지만 보여준다. 왜 그 결정을 내렸는지, AI와 어떻게 만들었는지는 사라진다.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              {
                label: "Git",
                role: "코드 이력",
                example: "어떤 코드가 언제 바뀌었나",
                color: "border-neutral-200 bg-white",
                tag: "text-neutral-500 bg-neutral-100 border-neutral-200",
              },
              {
                label: "HUGININ",
                role: "AI 결정 이력",
                example: "왜 그렇게 만들었나, AI가 어떻게 기여했나",
                color: "border-blue-200 bg-white",
                tag: "text-blue-600 bg-blue-50 border-blue-100",
                highlight: true,
              },
              {
                label: "Claude Skill / ChatGPT",
                role: "지금 이 순간 분석",
                example: "물어볼 때만. 과거 데이터 없음",
                color: "border-neutral-100 bg-neutral-50",
                tag: "text-neutral-400 bg-neutral-100 border-neutral-200",
              },
            ].map(({ label, role, example, color, tag, highlight }) => (
              <div key={label} className={`rounded-2xl border p-6 ${color} ${highlight ? "ring-2 ring-blue-200" : ""}`}>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border font-mono ${tag}`}>{label}</span>
                <p className="text-sm font-bold text-neutral-900 mt-3 mb-1">{role}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{example}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-4">역추적 예시</p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-neutral-400 font-mono mb-2">6개월 전 커밋</p>
                <div className="font-mono text-[13px] text-neutral-500 bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                  <span className="text-neutral-400">$</span> git log --oneline<br />
                  <span className="text-neutral-700">a3f2c1d refactor: simplify auth</span><br />
                  <span className="text-neutral-400 text-[11px]">6 months ago · dongkyu</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-mono mb-2">HUGININ 역추적</p>
                <div className="flex flex-col gap-2 bg-neutral-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase w-6 shrink-0 mt-0.5">왜</span>
                    <span className="text-[13px] text-neutral-700 leading-relaxed">OAuth 세션 만료로 UX 깨짐 → 자동 갱신 필요</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase w-6 shrink-0 mt-0.5">AI</span>
                    <span className="text-[13px] text-neutral-700 leading-relaxed">refresh token rotation + silent renewal 구현 주도</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase w-6 shrink-0 mt-0.5">vs</span>
                    <span className="text-[13px] text-neutral-700 leading-relaxed">cookie session 유지 방안 검토했으나 CORS 이슈로 제외</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3 text-center">Features</p>
          <h2 className="text-3xl font-bold text-neutral-900 text-center mb-14 tracking-tight">
            쌓고, 찾고, 이어간다
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-100">
            {[
              {
                icon: "⚡",
                title: "자동 수집 — 별도 입력 없음",
                desc: "git commit 하는 순간 Claude Code 세션이 자동으로 기록된다. 따로 할 일이 없다.",
              },
              {
                icon: "🔍",
                title: "의미 기반 역추적",
                desc: '"auth 관련 결정", "Redis 도입 이유" — 키워드가 달라도 의미로 과거 판단을 찾는다.',
              },
              {
                icon: "🧠",
                title: "팀 AI 지식베이스",
                desc: "쌓인 결정 이력이 팀의 자산이 된다. 새 팀원이 합류해도 과거 맥락을 그대로 넘겨받는다.",
              },
              {
                icon: "📊",
                title: "AI 기여도 자동 측정",
                desc: "Human-led · AI-assisted · AI-led · Automated — 이 결정에서 AI가 실제로 얼마나 기여했는지 자동 분류.",
              },
              {
                icon: "🤖",
                title: "MCP 컨텍스트 주입",
                desc: "새 Claude 세션 시작 전 과거 팀 결정이 자동으로 참조된다. 같은 실수를 반복하지 않는다.",
              },
              {
                icon: "📈",
                title: "AI 투자 ROI 가시화",
                desc: "AI 기여도가 높은 날 커밋 속도가 실제로 빠른가? 팀 AI 도입 효과를 데이터로 보여준다.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white p-8">
                <div className="text-2xl mb-4">{f.icon}</div>
                <h3 className="text-base font-bold text-neutral-900 mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Urgency */}
      <section className="bg-[#f5f4ef] py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-6">지금 시작해야 하는 이유</p>
          <h2 className="text-3xl font-bold text-neutral-900 mb-4 tracking-tight">
            AI 결정 이력은 소급 적용이 안 된다
          </h2>
          <p className="text-neutral-500 mb-10 text-base max-w-xl mx-auto leading-relaxed">
            Git을 뒤늦게 도입하면 과거 이력이 없듯, HUGININ도 지금부터 쌓은 것만 역추적할 수 있다.
            AI로 개발하는 커밋이 하루에 하나라도 있다면, 오늘부터 쌓을수록 나중의 자산이 커진다.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {[
              { period: "1개월 후", value: "패턴 파악", desc: "내가 AI를 어디에 주로 쓰는지 보인다" },
              { period: "3개월 후", value: "팀 지식베이스", desc: "왜 이런 구조가 됐는지 역추적 가능" },
              { period: "6개월 후", value: "AI 투자 증명", desc: "팀 생산성 변화를 데이터로 보여줄 수 있다" },
            ].map(({ period, value, desc }) => (
              <div key={period} className="bg-white rounded-2xl border border-neutral-200 p-5">
                <p className="text-[10px] font-mono text-neutral-400 mb-2">{period}</p>
                <p className="text-sm font-bold text-neutral-900 mb-1">{value}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Install */}
      <section id="how" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3 text-center">Quick Start</p>
          <h2 className="text-3xl font-bold text-neutral-900 text-center mb-3 tracking-tight">
            4단계, 1분이면 끝
          </h2>
          <p className="text-sm text-neutral-500 text-center mb-12">이후 Claude Code로 커밋할 때마다 자동으로 기록된다</p>
          <InstallSlider />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-900 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400 mb-6">Claude Code 사용자 전용</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
            지금 커밋이
            <br />6개월 뒤 자산이 된다.
          </h2>
          <p className="text-neutral-400 mb-10 text-base">git hook 설치 1분 · 별도 입력 없음 · 무료</p>
          <StartButton className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base">
            무료로 시작하기
            <ArrowRight size={18} />
          </StartButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-neutral-800 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-neutral-600 font-mono">
          <span className="tracking-widest uppercase">HUGININ</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}
