import { Brain, GitCommit, Search, Users, ArrowRight, Plug, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-mono font-bold text-white tracking-tight text-lg">HUGININ</span>
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
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <div className="mb-5">
          <span className="inline-block font-mono text-xs text-violet-400 border border-violet-800 bg-violet-950/40 px-3 py-1 rounded-full">
            Claude Code × Team Memory
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
          Claude Code가
          <br />
          <span className="text-violet-400">팀의 과거 결정을</span>
          <br />
          <span className="text-zinc-400">기억한다</span>
        </h1>

        <p className="text-lg text-zinc-400 max-w-2xl mb-4 leading-relaxed">
          HUGININ을 연결하면 Claude Code가 구현을 시작하기 전,
          팀이 같은 문제를 어떻게 풀었는지 자동으로 확인합니다.
          <br />
          같은 실수를 반복하지 않는 팀.
        </p>

        {/* Inline demo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-sm mb-10 max-w-2xl">
          <div className="text-zinc-500 mb-2 text-xs">// Claude Code 세션</div>
          <div className="text-zinc-200">
            <span className="text-zinc-500">You: </span>
            Redis pub/sub으로 알림 시스템 만들어줘
          </div>
          <div className="text-zinc-500 text-xs mt-1 mb-2">
            ↳ [huginin] 팀 이력 조회 중...
          </div>
          <div className="text-emerald-400 text-xs leading-relaxed">
            ✓ 2달 전 유사한 작업 발견 — WebSocket 방식 시도 후<br />
            &nbsp;&nbsp;연결 관리 복잡성으로 SSE로 전환한 이력이 있습니다.<br />
            &nbsp;&nbsp;당시 결정 이유를 참고해서 설계하겠습니다.
          </div>
        </div>

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
                Claude Code에 연결 — <span className="text-zinc-400 font-normal">.mcp.json 한 줄</span>
              </span>
            </div>
            <pre className="font-mono text-sm leading-relaxed overflow-x-auto text-zinc-300">{`// .mcp.json (프로젝트 루트)
{
  `}<span className="text-violet-400">&quot;mcpServers&quot;</span>{`: {
    `}<span className="text-violet-400">&quot;huginin&quot;</span>{`: {
      `}<span className="text-zinc-400">&quot;url&quot;</span>{`: `}<span className="text-emerald-400">&quot;https://api.huginin.dev/mcp&quot;</span>{`,
      `}<span className="text-zinc-400">&quot;type&quot;</span>{`: `}<span className="text-emerald-400">&quot;sse&quot;</span>{`
    }
  }
}`}</pre>
            <p className="text-xs text-zinc-600 mt-2 font-mono">
              → Claude Code 재시작 시 자동 연결 완료
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono text-violet-500 bg-violet-950/40 border border-violet-900 px-2 py-0.5 rounded">
                Step 2
              </span>
              <span className="text-sm font-medium text-zinc-200">
                Claude가 팀 메모리를 자동 참조
              </span>
            </div>
            <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
              <span className="text-zinc-500">{"# 개발자는 평소처럼 Claude Code를 사용"}</span>
              {"\n\n"}
              <span className="text-zinc-400">You: </span>
              <span className="text-zinc-200">새 API 엔드포인트에 rate limiting 붙여줘</span>
              {"\n\n"}
              <span className="text-zinc-600">{"[huginin.recall_decisions] "}</span>
              <span className="text-zinc-500">→ "rate limiting API" 검색 중...</span>
              {"\n"}
              <span className="text-emerald-500">{"  ✓ "}</span>
              <span className="text-zinc-400">3주 전 token bucket 방식 시도 → Redis 연결 비용으로 반려</span>
              {"\n"}
              <span className="text-emerald-500">{"  ✓ "}</span>
              <span className="text-zinc-400">in-memory sliding window로 최종 결정됨</span>
              {"\n\n"}
              <span className="text-zinc-400">Claude: </span>
              <span className="text-zinc-200">팀 이력 기반으로 sliding window 방식으로 구현하겠습니다...</span>
            </pre>
          </div>

          {/* Step 3 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono text-violet-500 bg-violet-950/40 border border-violet-900 px-2 py-0.5 rounded">
                Step 3
              </span>
              <span className="text-sm font-medium text-zinc-200">
                커밋마다 결정 자동 수집 → 팀 KB
              </span>
            </div>
            <pre className="font-mono text-sm leading-relaxed overflow-x-auto">
              <span className="text-green-400">$</span>
              <span className="text-zinc-200"> git commit -m "feat: add rate limiting"</span>
              {"\n"}
              <span className="text-zinc-500">{"[huginin] "}</span>
              <span className="text-zinc-400">prompt + response + diff + branch 수집됨</span>
              {"\n"}
              <span className="text-zinc-500">{"[huginin] "}</span>
              <span className="text-zinc-400">임베딩 생성 → 팀 메모리 인덱싱 완료</span>
              {"\n"}
              <span className="text-zinc-500">{"[huginin] "}</span>
              <span className="text-emerald-400">event_id: a3f2... → workspace KB</span>
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
              <Brain size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">팀 메모리</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Claude Memory는 나만 안다. HUGININ은 팀 전체가 공유한다.
              신입이 들어와도 팀의 결정 맥락을 바로 참조.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <Plug size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">MCP Native</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Claude Code가 구현 전 자동으로 팀 이력을 조회.
              개발자가 직접 검색하지 않아도 된다.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <GitCommit size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">코드와 결정 연결</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              diff, commit, branch와 AI 대화를 함께 저장.
              "왜 이 코드가 이렇게 됐는가"를 나중에 추적.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <Search size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">시맨틱 검색</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              "왜 Redis 대신 Postgres를 썼나" 자연어로 검색.
              키워드가 일치하지 않아도 의미로 찾는다.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <Users size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">팀 토론</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              각 AI 결정에 팀원이 코멘트를 달고 검토.
              "이 결정 괜찮아?" 라는 맥락이 남는다.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="mb-4 text-violet-400">
              <BarChart3 size={22} />
            </div>
            <h3 className="font-semibold text-white mb-2">AI 사용 분석</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              팀의 토큰 사용 추이, 브랜치별 AI 의존도.
              AI가 실제로 어디서 기여하는지 정량화.
            </p>
          </div>
        </div>
      </section>

      {/* vs Git AI */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6">
            vs. Git AI
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-mono text-zinc-500 mb-3">Git AI</p>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-zinc-600 mt-0.5">→</span>
                  "이 줄은 어떤 AI가 생성했나?" (코드 귀책)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-600 mt-0.5">→</span>
                  Git Notes에 로컬 저장 (팀 검색 불가)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-600 mt-0.5">→</span>
                  AI가 과거 이력을 참조하지 않음
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-mono text-violet-400 mb-3">HUGININ</p>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5">→</span>
                  "왜 이 결정을 내렸나?" (의사결정 맥락)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5">→</span>
                  중앙 DB + 시맨틱 검색 (팀 전체 조회)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5">→</span>
                  Claude Code가 구현 전 자동으로 팀 이력 참조
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-800 bg-black">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <p className="font-mono text-xs text-zinc-600 mb-4">
            {"// .mcp.json"}
          </p>
          <h2 className="text-2xl font-bold text-white mb-3">
            팀의 AI 결정을 Claude가 기억하게 하세요
          </h2>
          <p className="text-zinc-500 mb-8 text-sm">
            설정 1분 · Git hook 자동 수집 · 팀 즉시 공유
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
