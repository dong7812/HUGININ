"use client";

import { useState } from "react";

const STEPS = [
  {
    num: 1,
    label: "설치",
    tag: "Install",
    title: "CLI 설치",
    desc: "바이너리 하나로 끝난다. 의존성 없음.",
    terminal: [
      { t: "cmd",  v: "curl -sSL https://huginin.vercel.app/install.sh | bash" },
      { t: "gap" },
      { t: "ok",   v: "huginin 설치 완료" },
      { t: "info", v: "huginin v0.1.0" },
    ],
    meta: [
      { label: "플랫폼",  value: "macOS · Linux · WSL" },
      { label: "의존성",  value: "없음" },
      { label: "소스",    value: "github.com/dong7812/HUGININ" },
    ],
    tip: null,
  },
  {
    num: 2,
    label: "로그인",
    tag: "Login",
    title: "계정 로그인",
    desc: "huginin.vercel.app 에서 회원가입 후 이메일 + 비밀번호로 로그인.",
    terminal: [
      { t: "cmd",  v: "huginin login" },
      { t: "gap" },
      { t: "info", v: "Email: you@company.com" },
      { t: "info", v: "Password: ••••••••" },
      { t: "gap" },
      { t: "ok",   v: "로그인 완료" },
    ],
    meta: [
      { label: "저장 위치", value: "로컬 keychain" },
      { label: "유효 기간", value: "30일 자동 갱신" },
      { label: "방식",      value: "Email + Password" },
    ],
    tip: null,
  },
  {
    num: 3,
    label: "연결",
    tag: "Link",
    title: "레포 연결",
    desc: "작업 중인 git 레포를 대시보드 워크스페이스에 연결한다.",
    terminal: [
      { t: "cmd",  v: "cd your-project" },
      { t: "cmd",  v: "huginin project link" },
      { t: "gap" },
      { t: "info", v: "워크스페이스 선택 → my-team" },
      { t: "gap" },
      { t: "ok",   v: "프로젝트 연결 완료" },
    ],
    meta: [
      { label: "저장 위치", value: ".huginin/projects.json" },
      { label: "레포당",    value: "1회 설정" },
      { label: "팀 공유",   value: "gitignore 권장" },
    ],
    tip: null,
  },
  {
    num: 4,
    label: "Hook",
    tag: "Hook",
    title: "Git hook 설치",
    desc: "이후 커밋마다 Claude Code 세션이 자동으로 수집된다.",
    terminal: [
      { t: "cmd",  v: "huginin hook install" },
      { t: "gap" },
      { t: "ok",   v: "post-commit hook 설치됨" },
      { t: "gap" },
      { t: "dim",  v: "# 이제 커밋해보자" },
      { t: "cmd",  v: 'git commit -m "feat: add auth"' },
      { t: "info", v: "[huginin] Claude Code 세션 감지됨" },
      { t: "ok",   v: "event queued for commit a3f2c1d" },
    ],
    meta: [
      { label: "prompt",   value: "실제 Claude 대화" },
      { label: "response", value: "AI 응답 (2000자)" },
      { label: "diff",     value: "변경 파일 통계" },
    ],
    tip: "백그라운드 실행 — 커밋 속도에 영향 없음",
  },
];

const LINE_COLORS: Record<string, string> = {
  "1": "bg-blue-500",
  "2": "bg-violet-500",
  "3": "bg-emerald-500",
  "4": "bg-amber-500",
};
const ACTIVE_LABEL: Record<string, string> = {
  "1": "text-blue-400",
  "2": "text-violet-400",
  "3": "text-emerald-400",
  "4": "text-amber-400",
};
const ACTIVE_NUM: Record<string, string> = {
  "1": "border-blue-500 text-blue-400 bg-blue-500/10",
  "2": "border-violet-500 text-violet-400 bg-violet-500/10",
  "3": "border-emerald-500 text-emerald-400 bg-emerald-500/10",
  "4": "border-amber-500 text-amber-400 bg-amber-500/10",
};

export function InstallSlider() {
  const [current, setCurrent] = useState(0);
  const step = STEPS[current];
  const key = String(step.num);

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col sm:flex-row">

      {/* ── 좌측 네비 ── */}
      <div className="sm:w-44 shrink-0 flex sm:flex-col flex-row sm:border-r border-b sm:border-b-0 border-zinc-800">
        <div className="sm:pt-5 sm:pb-3 px-4 sm:px-5 py-3 sm:py-0">
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest hidden sm:block mb-4">
            Quick start
          </p>
        </div>
        {STEPS.map((s, i) => {
          const k = String(s.num);
          const isActive = i === current;
          const isDone = i < current;
          return (
            <button
              key={s.num}
              onClick={() => setCurrent(i)}
              className={`relative flex items-center gap-3 px-4 py-3 sm:py-3.5 text-left transition-all w-full sm:w-auto flex-1 sm:flex-none ${
                isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
              }`}
            >
              {/* 왼쪽 액티브 바 (desktop) */}
              {isActive && (
                <span className={`hidden sm:block absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full ${LINE_COLORS[k]}`} />
              )}
              <span className={`w-6 h-6 rounded-full border text-[10px] font-mono flex items-center justify-center shrink-0 transition-all ${
                isActive
                  ? ACTIVE_NUM[k]
                  : isDone
                    ? "border-zinc-700 bg-zinc-700/50 text-zinc-400"
                    : "border-zinc-800 text-zinc-600"
              }`}>
                {isDone ? (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : s.num}
              </span>
              <span className={`text-xs font-medium hidden sm:block transition-colors ${
                isActive ? ACTIVE_LABEL[k] : isDone ? "text-zinc-500" : "text-zinc-600"
              }`}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 중앙 터미널 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 헤더 */}
        <div className="px-5 pt-5 pb-4 border-b border-zinc-800/60">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              ACTIVE_NUM[key]
            } border-opacity-50`}>
              {step.tag}
            </span>
            <h3 className="text-sm font-semibold text-zinc-200">{step.title}</h3>
          </div>
          <p className="text-xs text-zinc-500">{step.desc}</p>
        </div>

        {/* 터미널 바디 */}
        <div className="flex-1 bg-zinc-950 p-5 font-mono text-[13px] space-y-1.5">
          {/* 창 컨트롤 */}
          <div className="flex gap-1.5 mb-4">
            <div className="w-3 h-3 rounded-full bg-zinc-800" />
            <div className="w-3 h-3 rounded-full bg-zinc-800" />
            <div className="w-3 h-3 rounded-full bg-zinc-800" />
          </div>

          {step.terminal.map((line, i) => {
            if (line.t === "gap") return <div key={i} className="h-1" />;
            if (line.t === "cmd") return (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="text-green-400 shrink-0 select-none">$</span>
                <span className="text-zinc-200 break-all leading-relaxed">{line.v}</span>
              </div>
            );
            if (line.t === "ok") return (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="text-emerald-400 shrink-0">✓</span>
                <span className="text-emerald-400/90 leading-relaxed">{line.v}</span>
              </div>
            );
            if (line.t === "info") return (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="text-zinc-600 shrink-0 select-none">›</span>
                <span className="text-zinc-400 leading-relaxed">{line.v}</span>
              </div>
            );
            if (line.t === "dim") return (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="text-zinc-700 leading-relaxed">{line.v}</span>
              </div>
            );
            return null;
          })}
        </div>

        {/* 하단 바 */}
        <div className="px-5 py-3 border-t border-zinc-800/60 flex items-center justify-between">
          {step.tip ? (
            <p className="text-[10px] font-mono text-zinc-600">{step.tip}</p>
          ) : (
            <div />
          )}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1 rounded-full transition-all ${
                  i === current
                    ? `w-4 ${LINE_COLORS[String(STEPS[current].num)]}`
                    : "w-1.5 bg-zinc-700 hover:bg-zinc-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── 우측 컨텍스트 ── */}
      <div className="hidden lg:flex sm:w-48 shrink-0 border-l border-zinc-800 flex-col">
        <div className="px-4 pt-5 pb-3 border-b border-zinc-800/60">
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Details</p>
        </div>
        <div className="flex-1 px-4 py-4 flex flex-col gap-3">
          {step.meta.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">{label}</span>
              <span className="text-[11px] text-zinc-300 font-mono">{value}</span>
            </div>
          ))}
        </div>
        <div className="px-4 py-4 border-t border-zinc-800/60 mt-auto">
          <p className="text-[9px] font-mono text-zinc-700 leading-relaxed">
            Step {step.num} / {STEPS.length}
          </p>
        </div>
      </div>

    </div>
  );
}
