"use client";

import { useState } from "react";

const STEPS = [
  {
    num: 1,
    label: "설치",
    tag: "Install",
    optional: false,
    title: "CLI 설치",
    desc: "바이너리 하나로 끝난다. 의존성 없음.",
    terminal: [
      { t: "cmd",  v: "curl -sSL https://huginin.com/install.sh | bash" },
      { t: "gap" },
      { t: "ok",   v: "huginin v0.1.0 설치 완료" },
      { t: "info", v: "macOS · Linux · WSL 지원" },
    ],
    meta: [
      { label: "플랫폼",    value: "macOS · Linux · WSL" },
      { label: "의존성",    value: "없음" },
      { label: "소요 시간", value: "~10초" },
    ],
    tip: null,
  },
  {
    num: 2,
    label: "tmux",
    tag: "Optional",
    optional: true,
    title: "tmux 설치 (선택사항)",
    desc: "claude · agy · codex를 Ctrl+\\로 전환하는 멀티플렉서를 사용할 때 tmux 안에서 실행하면 터미널을 닫아도 세션이 유지된다.",
    terminal: [
      { t: "dim",  v: "# tmux 없이도 huginin은 정상 동작합니다" },
      { t: "cmd",  v: "which tmux" },
      { t: "info", v: "tmux not found" },
      { t: "gap" },
      { t: "dim",  v: "# 설치 후 새 세션에서 실행 권장" },
      { t: "cmd",  v: "brew install tmux          # macOS" },
      { t: "cmd",  v: "sudo apt install tmux       # Ubuntu/Debian" },
      { t: "gap" },
      { t: "cmd",  v: "tmux new -s huginin" },
    ],
    meta: [
      { label: "필수 여부", value: "선택사항" },
      { label: "권장 상황", value: "멀티플렉서 장기 사용" },
      { label: "이유",      value: "터미널 종료 시 세션 유지" },
    ],
    tip: "멀티플렉서(Ctrl+\\) 장기 사용 시 tmux 세션 안에서 실행 권장",
  },
  {
    num: 3,
    label: "프로젝트",
    tag: "Project",
    optional: false,
    title: "프로젝트로 이동",
    desc: "git remote가 설정된 프로젝트 디렉토리로 이동한다. HUGININ은 remote origin으로 프로젝트를 식별한다.",
    terminal: [
      { t: "cmd",  v: "cd your-project" },
      { t: "gap" },
      { t: "dim",  v: "# remote origin이 설정된 프로젝트여야 합니다" },
      { t: "cmd",  v: "git remote -v" },
      { t: "gap" },
      { t: "info", v: "origin  https://github.com/you/project.git (fetch)" },
      { t: "info", v: "origin  https://github.com/you/project.git (push)" },
    ],
    meta: [
      { label: "필수 조건", value: "git remote 설정" },
      { label: "식별 방식", value: "remote origin URL" },
      { label: "로컬 전용", value: "지원 안 함" },
    ],
    tip: "git remote가 없으면 huginin setup이 동작하지 않습니다",
  },
  {
    num: 4,
    label: "huginin",
    tag: "TUI",
    optional: false,
    title: "huginin 실행",
    desc: "huginin TUI에 진입한다. 기본 도구는 claude-code이며, Ctrl+\\로 agy · codex로 전환할 수 있다. 이후 login · setup · claude 실행까지 모두 TUI 안에서 처리된다.",
    terminal: [
      { t: "cmd",      v: "huginin" },
      { t: "gap" },
      { t: "tui-init" },
      { t: "tui-warn", v: "로그인 필요 — login 입력" },
      { t: "tui-tool", v: "claude-code" },
      { t: "gap" },
      { t: "tui-hint" },
      { t: "tui-sep" },
      { t: "tui-prompt", v: "" },
    ],
    meta: [
      { label: "Ctrl + \\", value: "AI 도구 전환" },
      { label: "전환 대상", value: "claude · agy · codex" },
      { label: "상태 유지", value: "비활성 CLI 백그라운드 대기" },
    ],
    tip: "이후 모든 단계는 huginin > 프롬프트에서 실행됩니다",
  },
  {
    num: 5,
    label: "Login",
    tag: "Login",
    optional: false,
    title: "huginin > login",
    desc: "TUI 안에서 계정 로그인. 한 번 로그인하면 30일간 자동 유지된다.",
    terminal: [
      { t: "tui-init" },
      { t: "tui-warn", v: "로그인 필요 — login 입력" },
      { t: "tui-tool", v: "claude-code" },
      { t: "gap" },
      { t: "tui-hint" },
      { t: "tui-sep" },
      { t: "tui-cmd", v: "login" },
      { t: "gap" },
      { t: "info",    v: "Email: you@company.com" },
      { t: "info",    v: "Password: ••••••••" },
      { t: "gap" },
      { t: "tui-ok",  v: "workspace: my-project" },
      { t: "tui-prompt", v: "" },
    ],
    meta: [
      { label: "저장 위치", value: "로컬 keychain" },
      { label: "유효 기간", value: "30일 자동 갱신" },
      { label: "방식",      value: "Email + Password" },
    ],
    tip: null,
  },
  {
    num: 6,
    label: "Setup",
    tag: "Setup",
    optional: false,
    title: "huginin > setup",
    desc: "워크스페이스 연결과 git hook 설치를 한 번에. 이후 커밋마다 AI 대화가 자동 수집된다.",
    terminal: [
      { t: "tui-init" },
      { t: "tui-ok",   v: "workspace: my-project" },
      { t: "tui-tool", v: "claude-code" },
      { t: "gap" },
      { t: "tui-hint" },
      { t: "tui-sep" },
      { t: "tui-cmd",  v: "setup" },
      { t: "gap" },
      { t: "info",     v: "워크스페이스 선택 → my-project" },
      { t: "info",     v: "프로젝트 이름 → your-project" },
      { t: "gap" },
      { t: "tui-ok",   v: "setup 완료 — claude를 입력해 시작하세요" },
      { t: "tui-prompt", v: "" },
    ],
    meta: [
      { label: "저장 위치", value: ".huginin/projects.json" },
      { label: "레포당",    value: "1회 설정" },
      { label: "hook 위치", value: ".git/hooks/post-commit" },
    ],
    tip: "이후 커밋마다 AI 결정이 자동으로 Knowledge Base에 쌓입니다",
  },
  {
    num: 7,
    label: "Claude",
    tag: "Claude",
    optional: false,
    title: "huginin > claude",
    desc: "huginin TUI 안에서 Claude Code를 PTY로 실행한다. 커밋하면 AI 결정 맥락이 자동으로 Knowledge Base에 기록된다.",
    terminal: [
      { t: "tui-sep" },
      { t: "tui-cmd",    v: "claude" },
      { t: "gap" },
      { t: "tui-run",    v: "claude 시작 (Ctrl+\\: CLI 전환)" },
      { t: "gap" },
      { t: "tui-banner", v: "claude-code" },
      { t: "gap" },
      { t: "info",       v: "[Claude Code PTY가 전체 터미널을 점유합니다]" },
      { t: "gap" },
      { t: "dim",        v: "# 커밋하면 huginin이 세션을 자동 기록" },
      { t: "ok",         v: "Ctrl+\\ 로 huginin 프롬프트로 복귀" },
    ],
    meta: [
      { label: "전환",        value: "Ctrl + \\" },
      { label: "자동 수집",   value: "커밋마다 실행" },
      { label: "세션 윈도우", value: "최근 8시간" },
    ],
    tip: "Ctrl+\\ → huginin 프롬프트 → agy / codex 전환 가능",
  },
];

function TerminalLine({ line, idx }: { line: { t: string; v?: string }; idx: number }) {
  const { t, v = "" } = line;

  if (t === "gap") return <div key={idx} className="h-1" />;

  if (t === "cmd") return (
    <div className="flex gap-2.5 items-start">
      <span className="text-emerald-400 shrink-0 select-none">$</span>
      <span className="text-neutral-200 break-all leading-relaxed">{v}</span>
    </div>
  );

  if (t === "ok") return (
    <div className="flex gap-2.5 items-start">
      <span className="text-emerald-400 shrink-0">✓</span>
      <span className="text-emerald-300 leading-relaxed">{v}</span>
    </div>
  );

  if (t === "info") return (
    <div className="flex gap-2.5 items-start">
      <span className="text-neutral-600 shrink-0 select-none">›</span>
      <span className="text-neutral-400 leading-relaxed">{v}</span>
    </div>
  );

  if (t === "dim") return (
    <div className="text-neutral-700 leading-relaxed">{v}</div>
  );

  // ── TUI-specific renderers (faithful to session.go) ──────────────────────

  if (t === "tui-init") return (
    <div className="flex items-baseline gap-2">
      <span className="text-white font-bold tracking-wide">HUGININ</span>
      <span className="text-neutral-600 text-[11px]">v0.1.0</span>
    </div>
  );

  if (t === "tui-warn") return (
    <div className="flex gap-2 items-start">
      <span className="text-yellow-400 shrink-0">⚠</span>
      <span className="text-yellow-300">{v}</span>
    </div>
  );

  if (t === "tui-ok") return (
    <div className="flex gap-2 items-start">
      <span className="text-emerald-400 shrink-0">✓</span>
      <span className="text-neutral-300">{v}</span>
    </div>
  );

  if (t === "tui-tool") return (
    <div className="flex gap-1">
      <span className="text-neutral-600">tool:</span>
      <span className="text-white font-bold">{v}</span>
    </div>
  );

  if (t === "tui-hint") return (
    <div className="text-neutral-600 text-[11px] leading-relaxed">
      claude · agy · codex · setup · workspace · help · exit
    </div>
  );

  if (t === "tui-sep") return (
    <div className="text-neutral-700 tracking-widest">{"─".repeat(44)}</div>
  );

  // huginin (blue bold) + " > " (dim) + command
  if (t === "tui-cmd") return (
    <div className="flex items-start">
      <span className="text-blue-400 font-bold shrink-0 select-none">huginin</span>
      <span className="text-neutral-600 shrink-0 select-none"> &gt; </span>
      <span className="text-neutral-100 break-all leading-relaxed">{v}</span>
    </div>
  );

  // huginin > ▌ (blinking cursor)
  if (t === "tui-prompt") return (
    <div className="flex items-center">
      <span className="text-blue-400 font-bold select-none">huginin</span>
      <span className="text-neutral-600 select-none"> &gt; </span>
      <span className="inline-block w-2 h-[14px] bg-neutral-400/60 animate-pulse rounded-sm" />
    </div>
  );

  // ─ message ─ (dim, from claudeDoneMsg / startCLI)
  if (t === "tui-run") return (
    <div className="text-neutral-600">─ {v} ─</div>
  );

  // ── huginin ▸ name ──  Ctrl+\: 전환  (from showBanner)
  if (t === "tui-banner") return (
    <div className="flex items-center gap-2">
      <span className="text-cyan-400">── huginin ▸ {v} ──</span>
      <span className="text-neutral-600 text-[11px]">Ctrl+\: 전환</span>
    </div>
  );

  return null;
}

export function InstallSlider() {
  const [current, setCurrent] = useState(0);
  const step = STEPS[current];
  const isTui = step.num >= 4;

  return (
    <div className="w-full rounded-2xl border border-neutral-200 bg-white overflow-hidden flex flex-col sm:flex-row">
      {/* Left nav */}
      <div className="sm:w-44 shrink-0 flex sm:flex-col flex-row sm:border-r border-b sm:border-b-0 border-neutral-100 bg-[#f5f4ef]">
        <div className="hidden sm:block px-5 pt-5 pb-3">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-neutral-400">Quick start</p>
        </div>
        {STEPS.map((s, i) => {
          const isActive = i === current;
          const isDone = i < current;
          const isTuiStep = s.num >= 4;
          return (
            <button
              key={s.num}
              onClick={() => setCurrent(i)}
              className={`relative flex items-center gap-3 px-4 py-3 sm:py-3.5 text-left transition-all w-full sm:w-auto flex-1 sm:flex-none ${
                isActive ? "bg-white" : "hover:bg-neutral-100/50"
              }`}
            >
              {isActive && (
                <span className={`hidden sm:block absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full ${isTuiStep ? "bg-blue-500" : "bg-blue-600"}`} />
              )}
              <span className={`w-6 h-6 rounded-full border text-[10px] font-mono flex items-center justify-center shrink-0 transition-all ${
                isActive
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : isDone
                  ? "border-neutral-300 bg-neutral-200 text-neutral-500"
                  : "border-neutral-200 text-neutral-400"
              }`}>
                {isDone ? (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : s.num}
              </span>
              <div className="hidden sm:flex flex-col gap-0.5 min-w-0">
                <span className={`text-xs font-medium transition-colors truncate ${
                  isActive ? "text-blue-600" : isDone ? "text-neutral-500" : "text-neutral-400"
                }`}>
                  {s.label}
                </span>
                {s.optional && (
                  <span className="text-[9px] text-neutral-400 font-mono">선택사항</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Terminal */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-5 pt-5 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
              step.optional
                ? "border-neutral-200 text-neutral-500 bg-neutral-50"
                : isTui
                ? "border-blue-100 text-blue-600 bg-blue-50"
                : "border-blue-100 text-blue-600 bg-blue-50"
            }`}>
              {step.tag}
            </span>
            <h3 className="text-sm font-bold text-neutral-900">{step.title}</h3>
          </div>
          <p className="text-xs text-neutral-500">{step.desc}</p>
        </div>

        {/* Terminal body */}
        <div className="flex-1 bg-neutral-900 p-5 font-mono text-[13px] space-y-1.5">
          <div className="flex gap-1.5 mb-4">
            <div className="w-3 h-3 rounded-full bg-neutral-700" />
            <div className="w-3 h-3 rounded-full bg-neutral-700" />
            <div className="w-3 h-3 rounded-full bg-neutral-700" />
          </div>
          {step.terminal.map((line, i) => (
            <TerminalLine key={i} line={line} idx={i} />
          ))}
        </div>

        <div className="px-5 py-3 border-t border-neutral-100 bg-white flex items-center justify-between">
          {step.tip ? (
            <p className="text-[10px] font-mono text-neutral-400">{step.tip}</p>
          ) : <div />}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`h-1 rounded-full transition-all ${
                  i === current ? "w-4 bg-blue-600" : "w-1.5 bg-neutral-200 hover:bg-neutral-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right context */}
      <div className="hidden lg:flex sm:w-48 shrink-0 border-l border-neutral-100 flex-col bg-[#f5f4ef]">
        <div className="px-4 pt-5 pb-3 border-b border-neutral-100">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-neutral-400">Details</p>
        </div>
        <div className="flex-1 px-4 py-4 flex flex-col gap-3">
          {step.meta.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-400">{label}</span>
              <span className="text-[12px] text-neutral-700 font-mono">{value}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-4 border-t border-neutral-100">
          <p className="text-[9px] font-mono text-neutral-400">Step {step.num} / {STEPS.length}</p>
        </div>
      </div>
    </div>
  );
}
