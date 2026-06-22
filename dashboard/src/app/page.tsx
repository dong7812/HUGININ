import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { InstallSlider } from "./InstallSlider";
import { StartButton } from "./StartButton";

function DashboardPreview() {
  const items = [
    {
      frame: "C",
      frameColor: "bg-purple-100 text-purple-700",
      title: "ETL 파이프라인 + pgvector HNSW 인덱스 구축",
      rejected: "Redis → PostgreSQL pgvector — 인프라 비용 절감",
      time: "2h ago",
      ai: "78%",
    },
    {
      frame: "B",
      frameColor: "bg-blue-100 text-blue-700",
      title: "refresh token rotation + silent renewal 구현",
      rejected: "cookie session → CORS 이슈로 제외됨",
      time: "6h ago",
      ai: "61%",
    },
    {
      frame: "A",
      frameColor: "bg-green-100 text-green-700",
      title: "Railway Dockerfile CMD PORT env var 수정",
      rejected: null,
      time: "1d ago",
      ai: "22%",
    },
  ];

  return (
    <div className="rounded-2xl border border-neutral-200/80 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 px-4 sm:px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Image src="/web-app-manifest-192x192.png" alt="HUGININ" width={18} height={18} className="opacity-70 shrink-0" />
          <span className="text-[11px] font-bold text-neutral-700 tracking-widest font-mono uppercase">HUGININ</span>
          <span className="text-neutral-200 mx-0.5">/</span>
          <span className="text-[11px] text-neutral-400 truncate">AURA</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-1 rounded-md font-medium hidden sm:block">AI 브리핑</span>
          <span className="text-[10px] bg-neutral-900 text-white px-2.5 py-1 rounded-md font-medium">설정</span>
        </div>
      </div>

      {/* Stats — 2x2 on mobile, 4-col on sm+ */}
      <div className="bg-[#f5f4ef] px-3 sm:px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "총 결정", value: "247" },
          { label: "이번 주", value: "18" },
          { label: "AI 기여도", value: "74%" },
          { label: "팀원", value: "3명" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl px-3 py-2.5 border border-neutral-100/80">
            <p className="text-[10px] text-neutral-400 mb-0.5">{s.label}</p>
            <p className="text-sm font-bold text-neutral-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-[#f5f4ef] px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="bg-white rounded-xl border border-neutral-200/60 overflow-hidden">
          <div className="px-3 sm:px-4 py-2.5 border-b border-neutral-100 flex items-center">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">Decision Timeline</span>
            <span className="ml-auto text-[10px] text-neutral-300 font-mono hidden sm:block">all · branch · frame</span>
          </div>
          {items.map((item, i) => (
            <div key={i} className={`px-3 sm:px-4 py-3 ${i < items.length - 1 ? "border-b border-neutral-100" : ""}`}>
              <div className="flex items-start gap-2">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 mt-0.5 ${item.frameColor}`}>
                  {item.frame}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-xs font-medium text-neutral-900 leading-snug line-clamp-1">{item.title}</p>
                  {item.rejected && (
                    <p className="text-[10px] text-red-400 mt-0.5 font-mono truncate">✕ {item.rejected}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="text-[10px] text-neutral-400 font-mono">{item.ai}</span>
                  <span className="text-[10px] text-neutral-300">{item.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/web-app-manifest-192x192.png" alt="HUGININ" width={26} height={26} className="opacity-80" />
            <span className="font-mono font-bold text-neutral-900 tracking-widest text-[13px] uppercase">HUGININ</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-5">
            <a href="#why" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors hidden md:block">Why</a>
            <a href="#features" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors hidden md:block">Features</a>
            <a href="#how" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors hidden md:block">Install</a>
            <StartButton className="text-sm bg-neutral-900 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg font-medium transition-colors ml-2">
              Start free
            </StartButton>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-0 px-5 sm:px-6 text-center bg-white overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 top-0 h-[700px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.06),transparent)] pointer-events-none" />

        <div className="max-w-5xl mx-auto relative">
          {/* Logo */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <Image
              src="/web-app-manifest-512x512.png"
              alt="HUGININ"
              width={80}
              height={80}
              className="opacity-80"
              priority
            />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-neutral-100 rounded-full px-4 py-1.5 mb-8 sm:mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
            <span className="text-xs text-neutral-600 font-medium">Claude Code 전용 · 무료</span>
          </div>

          {/* Headline */}
          <h1 className="text-[52px] sm:text-7xl lg:text-[88px] font-bold text-neutral-900 leading-[1.05] tracking-tight mb-5 break-keep">
            코드는 남아도,
            <br />
            <span className="text-neutral-300">결정은 사라진다.</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-neutral-800 mb-5 break-keep">
            당신이 쓰지 않은 것까지.
          </p>

          {/* Body */}
          <p className="text-sm sm:text-base lg:text-lg text-neutral-500 max-w-xl mx-auto leading-relaxed mb-10 break-keep">
            DECISIONS.md에 적지 않은 것, 대화 중 기각한 대안, 당시 제약 조건 —
            Claude Code 세션마다 결정 맥락이 커밋과 함께 자동으로 쌓인다.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mb-14 sm:mb-16">
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
          <p className="text-xs text-neutral-400 mb-12 font-mono">git hook 설치 1분 · 별도 입력 없음 · 무료</p>

          {/* Dashboard preview */}
          <div className="relative mx-auto max-w-3xl">
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/60 to-transparent z-10 pointer-events-none rounded-b-2xl" />
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="why" className="pt-28 sm:pt-36 pb-20 sm:pb-28 px-5 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-4 text-center font-mono">Why HUGININ</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 text-center mb-4 tracking-tight leading-tight break-keep">
            Same question.
            <br /><span className="text-neutral-300">Very different answer.</span>
          </h2>
          <p className="text-sm sm:text-base text-neutral-500 text-center mb-12 sm:mb-16 max-w-lg mx-auto leading-relaxed break-keep">
            코드 분석 AI는 지금 코드에 있는 것만 읽는다.
            HUGININ은 결정이 내려진 순간을 기록한다.
          </p>

          {/* Question card */}
          <div className="bg-neutral-50 rounded-2xl border border-neutral-200 px-6 py-5 mb-3 text-center">
            <p className="text-[10px] text-neutral-400 font-mono mb-2 uppercase tracking-widest">A new engineer asks</p>
            <p className="text-base sm:text-lg font-semibold text-neutral-900">&ldquo;Why did we build auth this way?&rdquo;</p>
          </div>

          {/* Side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* Code AI */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-[10px] font-bold px-2 py-1 rounded-md border font-mono text-neutral-500 bg-neutral-100 border-neutral-200">
                  Code Analysis AI
                </span>
                <span className="text-[10px] text-neutral-400">Claude · Cursor</span>
              </div>
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 mb-4 min-h-[80px] flex items-start">
                <p className="text-sm text-neutral-500 leading-relaxed">
                  &ldquo;Uses JWT with argon2 hashing. Refresh tokens are stored in the database.&rdquo;
                </p>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">코드에 있는 것만. 왜 그 선택을 했는지는 모른다.</p>
            </div>

            {/* HUGININ */}
            <div className="rounded-2xl border-2 border-neutral-900 bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-[10px] font-bold px-2 py-1 rounded-md border font-mono text-neutral-900 bg-neutral-100 border-neutral-300">
                  HUGININ MCP
                </span>
                <span className="text-[10px] text-neutral-400">결정 당시 맥락</span>
              </div>
              <div className="flex flex-col gap-3 bg-neutral-50 rounded-xl p-4 border border-neutral-200 mb-4">
                {[
                  { label: "Why", text: "OAuth session expiry broke UX → needed silent auto-renewal", color: "text-neutral-400" },
                  { label: "Rejected", text: "Redis session → Railway memory cost ruled it out", color: "text-red-500" },
                  { label: "Constraint", text: "Mobile client required stateless auth", color: "text-neutral-400" },
                ].map((row, i, arr) => (
                  <div key={row.label}>
                    <div className="flex gap-3">
                      <span className={`text-[9px] font-bold uppercase w-[60px] shrink-0 mt-0.5 font-mono ${row.color}`}>{row.label}</span>
                      <span className="text-sm text-neutral-700 leading-relaxed">{row.text}</span>
                    </div>
                    {i < arr.length - 1 && <div className="h-px bg-neutral-100 mt-3" />}
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">코드에 없는 것. 결정 당시에만 존재했던 맥락.</p>
            </div>
          </div>

          {/* Trace example */}
          <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-5 font-mono">Trace example · 역추적 예시</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-neutral-400 font-mono mb-2 uppercase tracking-wider">6개월 전 커밋</p>
                <div className="font-mono text-[11px] sm:text-[12px] text-neutral-500 bg-white rounded-xl p-4 border border-neutral-200 leading-relaxed">
                  <span className="text-neutral-400">$ </span>git log --oneline<br />
                  <span className="text-neutral-800 font-medium">a3f2c1d refactor: simplify auth</span><br />
                  <span className="text-neutral-400 text-[10px]">6 months ago · dongkyu</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-neutral-400 font-mono mb-2 uppercase tracking-wider">HUGININ recall</p>
                <div className="flex flex-col gap-2.5 bg-white rounded-xl p-4 border border-neutral-200">
                  {[
                    { label: "Why", text: "OAuth 세션 만료로 UX 깨짐 → 자동 갱신 필요", color: "text-neutral-400" },
                    { label: "AI", text: "refresh token rotation + silent renewal 구현 주도", color: "text-neutral-400" },
                    { label: "Rejected", text: "cookie session — CORS 이슈로 제외", color: "text-red-500" },
                  ].map((r) => (
                    <div key={r.label} className="flex gap-2.5">
                      <span className={`text-[9px] font-bold uppercase w-12 shrink-0 mt-0.5 font-mono ${r.color}`}>{r.label}</span>
                      <span className="text-xs text-neutral-700 leading-relaxed">{r.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
              { title: "자동 수집", sub: "별도 입력 없음", desc: "git commit 하는 순간 Claude Code 세션이 자동으로 기록된다. 따로 할 일이 없다.", soon: false },
              { title: "의미 기반 역추적", sub: "시맨틱 검색", desc: '"auth 관련 결정", "Redis 도입 이유" — 키워드가 달라도 의미로 과거 판단을 찾는다.', soon: false },
              { title: "컨텍스트 추출", sub: "3단계 상세도", desc: "전체 의사결정 히스토리를 Markdown으로 다운로드. 새 AI 세션에 컨텍스트로 붙여넣거나 팀 온보딩 문서로 활용한다.", soon: false },
              { title: "AI 기여도 측정", sub: "Frame A / B / C / D", desc: "Human-led → AI-led — 이 결정에서 AI가 실제로 얼마나 기여했는지 자동 분류. 트렌드 차트로 패턴을 확인한다.", soon: false },
              { title: "MCP recall_decisions", sub: "Coming soon", desc: "Claude Code에 .mcp.json 한 줄로 등록하면 Claude가 새 세션에서 팀 과거 결정을 직접 검색한다. 파일 기반 자동 주입 준비 중.", soon: true },
              { title: "AI 투자 ROI", sub: "Coming soon", desc: "AI 기여도가 높은 날 커밋 속도가 실제로 빠른가? 축적된 데이터로 팀의 AI 활용 효과를 수치로 보여준다.", soon: true },
            ].map((f) => (
              <div key={f.title} className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all ${f.soon ? "border-neutral-100 opacity-60" : "border-neutral-200 hover:border-neutral-300 hover:shadow-sm"}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className={`text-[10px] font-semibold uppercase tracking-wider font-mono ${f.soon ? "text-neutral-300" : "text-neutral-400"}`}>{f.sub}</p>
                  {f.soon && <span className="text-[9px] font-bold bg-neutral-100 text-neutral-400 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">Soon</span>}
                </div>
                <h3 className={`text-base font-bold mb-2 ${f.soon ? "text-neutral-400" : "text-neutral-900"}`}>{f.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Urgency */}
      <section className="py-20 sm:py-28 px-5 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-4 font-mono">지금 시작해야 하는 이유</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-5 tracking-tight break-keep">
            AI 결정 이력은<br />소급 적용이 안 된다
          </h2>
          <p className="text-neutral-500 mb-12 text-sm sm:text-base max-w-xl mx-auto leading-relaxed break-keep">
            Git을 뒤늦게 도입하면 과거 이력이 없듯, HUGININ도 지금부터 쌓은 것만 역추적할 수 있다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            {[
              { period: "1개월 후", value: "패턴 파악", desc: "내가 AI를 어디에 주로 쓰는지 보인다" },
              { period: "3개월 후", value: "프로젝트 지식베이스", desc: "왜 이런 구조가 됐는지 역추적 가능" },
              { period: "6개월 후", value: "AI 투자 증명", desc: "팀 생산성 변화를 데이터로 보여줄 수 있다" },
            ].map(({ period, value, desc }) => (
              <div key={period} className="bg-neutral-50 rounded-2xl border border-neutral-200 p-5">
                <p className="text-[10px] font-mono text-neutral-400 mb-2">{period}</p>
                <p className="text-sm font-bold text-neutral-900 mb-1">{value}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
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
            4단계, 1분이면 끝
          </h2>
          <p className="text-sm text-neutral-500 text-center mb-12">이후 Claude Code로 커밋할 때마다 자동으로 기록된다</p>
          <InstallSlider />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-900 py-24 sm:py-32 px-5 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-600 mb-6 font-mono">Claude Code 사용자 전용</p>
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
