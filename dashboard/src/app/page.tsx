import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { InstallSlider } from "./InstallSlider";
import { StartButton } from "./StartButton";
import { NavFeaturesDropdown } from "./NavFeaturesDropdown";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/web-app-manifest-192x192.png" alt="HUGININ" width={50} height={50} className="opacity-80" />
            <span className="font-mono font-bold text-neutral-900 tracking-widest text-[13px] uppercase">HUGININ</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-5">
            <NavFeaturesDropdown />
            <a href="#how" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors hidden md:block">Install</a>
            <StartButton className="text-sm bg-neutral-900 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg font-medium transition-colors ml-2">
              Start free
            </StartButton>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-20 px-5 sm:px-6 text-center bg-white overflow-hidden">
        <div className="absolute inset-0 top-0 h-[600px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.06),transparent)] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative">
          <div className="flex justify-center mb-6 sm:mb-8">
            <Image src="/web-app-manifest-512x512.png" alt="HUGININ" width={72} height={72} className="opacity-80" priority />
          </div>

          <div className="inline-flex items-center gap-2 bg-neutral-100 rounded-full px-4 py-1.5 mb-8 sm:mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
            <span className="text-xs text-neutral-600 font-medium">커밋 · 프롬프트 · 문서 → Knowledge Base · 무료</span>
          </div>

          <h1 className="text-[52px] sm:text-7xl lg:text-[80px] font-bold text-neutral-900 leading-[1.05] tracking-tight mb-5 break-keep">
            코드는 남아도,
            <br />
            <span className="text-neutral-300">결정은 사라진다.</span>
          </h1>

          <p className="text-xl sm:text-2xl font-semibold text-neutral-800 mb-5 break-keep">
            당신이 쓰지 않은 것까지.
          </p>

          <p className="text-sm sm:text-base text-neutral-500 max-w-xl mx-auto leading-relaxed mb-10 break-keep">
            커밋 이력, 프롬프트 대화, 설계 문서 — 세 가지 소스에서 AI 결정 맥락이 자동으로 쌓여 프로젝트 Knowledge Base가 된다.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mb-4">
            <StartButton className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-all text-sm shadow-sm">
              무료로 시작하기
              <ArrowRight size={15} />
            </StartButton>
            <a
              href="#how"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 text-neutral-600 font-medium px-7 py-3.5 rounded-xl transition-all text-sm"
            >
              설치 방법
            </a>
          </div>
          <p className="text-xs text-neutral-400 font-mono">git hook 설치 1분 · 별도 입력 없음 · 무료</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28 px-5 sm:px-6 bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-4 text-center font-mono">Features</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 text-center mb-14 sm:mb-16 tracking-tight break-keep">
            쌓고, 찾고, 이어간다
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              {
                title: "자동 수집",
                sub: "별도 입력 없음",
                desc: "git commit 하는 순간 사용 중인 AI CLI(Claude · agy · codex) 세션이 자동으로 기록된다. 따로 할 일이 없다.",
                soon: false,
              },
              {
                title: "문서 임포트",
                sub: "콜드스타트 해결",
                desc: "huginin import DECISIONS.md — 기존 ADR·README를 Haiku ETL로 구조화해 임베딩. 프로젝트 중간 도입해도 과거 맥락을 복구한다.",
                soon: false,
              },
              {
                title: "의미 기반 역추적",
                sub: "시맨틱 검색",
                desc: '"auth 관련 결정", "Redis 도입 이유" — 키워드가 달라도 의미로 과거 판단을 찾는다. 커밋과 문서 레코드를 함께 검색한다.',
                soon: false,
              },
              {
                title: "컨텍스트 추출",
                sub: "3단계 상세도",
                desc: "전체 의사결정 히스토리를 Markdown으로 다운로드. 새 AI 세션에 컨텍스트로 붙여넣거나 프로젝트 온보딩 문서로 활용한다.",
                soon: false,
              },
              {
                title: "AI 기여도 측정",
                sub: "Frame A / B / C / D",
                desc: "Human-led → AI-led — 이 결정에서 AI가 실제로 얼마나 기여했는지 자동 분류. 트렌드 차트로 패턴을 확인한다.",
                soon: false,
              },
              {
                title: "멀티 CLI 전환",
                sub: "huginin TUI",
                desc: "huginin 안에서 claude · agy · codex를 Ctrl+\\로 자유롭게 전환. 비활성 CLI는 백그라운드에서 잠들어 있다가 전환 즉시 깨어난다.",
                soon: false,
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm p-5 sm:p-6 transition-all"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider font-mono text-neutral-400 mb-1.5">{f.sub}</p>
                <h3 className="text-base font-bold text-neutral-900 mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Install */}
      <section id="how" className="py-20 sm:py-28 px-5 sm:px-6 bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-4 text-center font-mono">Quick Start</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 text-center mb-3 tracking-tight break-keep">
            시작하기, 2분이면 끝
          </h2>
          <p className="text-sm text-neutral-500 text-center mb-12">설치 → 프로젝트 이동 → huginin TUI 진입 → login · setup · claude 실행</p>
          <InstallSlider />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-900 py-24 sm:py-32 px-5 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-600 mb-6 font-mono">Claude · agy · codex 지원</p>
          <h2 className="text-5xl sm:text-6xl font-bold text-white mb-5 tracking-tight leading-[1.05] break-keep">
            지금 커밋이<br />6개월 뒤 자산이 된다.
          </h2>
          <p className="text-neutral-500 mb-10 text-sm sm:text-base">git hook 설치 1분 · 별도 입력 없음 · 무료</p>
          <StartButton className="inline-flex items-center gap-2 bg-white hover:bg-neutral-100 text-neutral-900 font-semibold px-8 py-4 rounded-xl transition-all text-base shadow-sm">
            무료로 시작하기
            <ArrowRight size={18} />
          </StartButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-white/5 px-5 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-neutral-600 font-mono">
          <span className="tracking-widest uppercase">HUGININ</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}
