import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InstallSlider } from "./InstallSlider";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-mono font-bold text-neutral-900 tracking-widest text-sm uppercase">HUGININ</span>
          <div className="flex items-center gap-6">
            <a href="#how" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">설치</a>
            <a href="#features" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">기능</a>
            <Link href="/login"
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — Tesla style: full width, centered, large type */}
      <section className="pt-32 pb-24 px-6 text-center bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600 mb-6">
            Claude Code 전용
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-neutral-900 leading-[1.05] tracking-tight mb-8">
            AI로 만든다.
            <br />
            <span className="text-neutral-400">왜 그렇게 만들었는지</span>
            <br />
            기억하나?
          </h1>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Claude Code 세션마다 <span className="text-neutral-900 font-medium">무엇을 만들었고, 왜 그렇게 결정했는지</span>를
            git commit과 함께 자동으로 기록한다.
            3주 뒤 "왜 이렇게 했지?"가 사라진다.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-sm">
              무료로 시작하기
              <ArrowRight size={16} />
            </Link>
            <a href="#how"
              className="inline-flex items-center gap-2 border border-neutral-200 hover:border-neutral-400 text-neutral-700 font-medium px-7 py-3.5 rounded-xl transition-colors text-sm">
              설치 방법
            </a>
          </div>
          <p className="text-xs text-neutral-400 mt-5 font-mono">git hook 설치 1분 · 별도 입력 없음 · 무료</p>
        </div>
      </section>

      {/* Before / After — ivory section */}
      <section className="bg-[#f5f4ef] py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3 text-center">Problem</p>
          <h2 className="text-3xl font-bold text-neutral-900 text-center mb-12 tracking-tight">
            커밋 메시지에 묻히는 결정들
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Without */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Without HUGININ</p>
              <div className="font-mono text-[13px] flex flex-col gap-2 mb-5 text-neutral-500">
                <span>git commit -m &quot;refactor: simplify auth&quot;</span>
                <span>git commit -m &quot;feat: add retry logic&quot;</span>
                <span>git commit -m &quot;fix: edge case&quot;</span>
              </div>
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                <p className="text-sm text-neutral-500 italic leading-relaxed">
                  "3주 뒤: 왜 auth를 이렇게 바꿨지?<br />
                  Claude한테 또 물어봐야겠다..."
                </p>
              </div>
            </div>

            {/* With */}
            <div className="bg-white rounded-2xl overflow-hidden border border-blue-100">
              <div className="px-5 py-3 bg-blue-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-300" />
                  <span className="text-[11px] font-mono text-blue-100">feat/auth · 자동 기록됨</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">HUGININ</span>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <p className="text-sm font-semibold text-neutral-900 leading-snug">
                  JWT refresh token 전략 채택
                </p>
                <div className="flex gap-3">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase w-4 shrink-0 mt-0.5">왜</span>
                  <span className="text-[13px] text-neutral-600 leading-relaxed">OAuth 세션 만료로 UX 깨짐 → 자동 갱신 필요</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase w-4 shrink-0 mt-0.5">AI</span>
                  <span className="text-[13px] text-neutral-600 leading-relaxed">refresh token rotation + silent renewal 구현</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-neutral-100">
                  <span className="text-[10px] font-semibold font-mono text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg">B · AI-assisted</span>
                  <div className="flex items-center gap-1.5 flex-1">
                    <div className="flex-1 h-1 rounded-full bg-neutral-100 overflow-hidden max-w-[80px]">
                      <div className="h-full w-[68%] rounded-full bg-blue-500" />
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">AI 68%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features — white section */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3 text-center">Features</p>
          <h2 className="text-3xl font-bold text-neutral-900 text-center mb-14 tracking-tight">
            기억하고, 찾고, 개선한다
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-100">
            {[
              {
                icon: "📝",
                title: "결정 맥락 자동 보존",
                desc: "커밋마다 왜 그 결정을 내렸는지 자동으로 기록한다. Claude Code 세션에서 직접 추출하므로 별도 입력 없음."
              },
              {
                icon: "🔍",
                title: "의미 검색",
                desc: '"Redis 관련 결정 전부", "인증 방식 바꾼 이유" — 키워드가 달라도 의미로 과거 판단을 찾는다.'
              },
              {
                icon: "📊",
                title: "AI 협업 패턴 분류",
                desc: "Human-led · AI-assisted · AI-led · Automated — 이 결정에서 내가 주도했는지 AI가 주도했는지 자동 분류."
              },
              {
                icon: "⚡",
                title: "캐시 전략 제안",
                desc: "같은 도메인 프롬프트를 반복하면 감지해서 CLAUDE.md 최적화를 제안한다. 토큰과 시간을 아낀다."
              },
              {
                icon: "📈",
                title: "팀 생산성 리듬",
                desc: "커밋 속도와 AI 기여도를 함께 추적한다. Claude Code를 많이 쓴 날 실제로 더 빠른지 데이터로."
              },
              {
                icon: "🤖",
                title: "MCP 자동 참조",
                desc: "Claude가 구현 전 과거 결정을 자동으로 확인한다. 3일 전 같은 시도 → 결과를 먼저 알려준다."
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

      {/* Frame A/B/C/D — ivory section */}
      <section className="bg-[#f5f4ef] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3 text-center">Frame A / B / C / D</p>
          <h2 className="text-3xl font-bold text-neutral-900 text-center mb-3 tracking-tight">
            AI 협업 수준을 4단계로 분류
          </h2>
          <p className="text-sm text-neutral-500 text-center mb-12">결정마다 인간과 AI의 역할이 자동으로 측정된다</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { f: "A", label: "Human-led",   who: "인간 주도", desc: "인간이 설계·결정, AI는 참고 정도", color: "border-sky-200 bg-white", tag: "text-sky-600 bg-sky-50 border-sky-100" },
              { f: "B", label: "AI-assisted", who: "AI 보조",   desc: "AI 초안 제안, 인간이 검토·수정",   color: "border-blue-200 bg-white", tag: "text-blue-600 bg-blue-50 border-blue-100" },
              { f: "C", label: "AI-led",      who: "AI 주도",   desc: "AI가 구현 대부분, 인간은 방향·검수", color: "border-emerald-200 bg-white", tag: "text-emerald-600 bg-emerald-50 border-emerald-100" },
              { f: "D", label: "Automated",   who: "자동화",    desc: "AI가 독립 실행, 인간 개입 최소",   color: "border-orange-200 bg-white", tag: "text-orange-600 bg-orange-50 border-orange-100" },
            ].map(({ f, label, who, desc, color, tag }) => (
              <div key={f} className={`rounded-2xl border p-6 ${color}`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border font-mono ${tag}`}>{f}</span>
                  <span className="text-xs text-neutral-500">{who}</span>
                </div>
                <p className="text-sm font-bold text-neutral-900 mb-1">{label}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Install — white */}
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

      {/* CTA — black section (Tesla style) */}
      <section className="bg-neutral-900 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400 mb-6">Claude Code 사용자 전용</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
            AI 쓰면서 까먹는 why,
            <br />이제 자동으로 남긴다
          </h2>
          <p className="text-neutral-400 mb-10 text-base">git hook 설치 1분 · 별도 입력 없음 · 개인도, 팀도 무료</p>
          <Link href="/login"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base">
            무료로 시작하기
            <ArrowRight size={18} />
          </Link>
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
