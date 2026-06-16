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

export function InstallSlider() {
  const [current, setCurrent] = useState(0);
  const step = STEPS[current];

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
          return (
            <button
              key={s.num}
              onClick={() => setCurrent(i)}
              className={`relative flex items-center gap-3 px-4 py-3 sm:py-3.5 text-left transition-all w-full sm:w-auto flex-1 sm:flex-none ${
                isActive ? "bg-white" : "hover:bg-neutral-100/50"
              }`}
            >
              {isActive && <span className="hidden sm:block absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-blue-600" />}
              <span className={`w-6 h-6 rounded-full border text-[10px] font-mono flex items-center justify-center shrink-0 transition-all ${
                isActive ? "border-blue-600 text-blue-600 bg-blue-50" :
                isDone ? "border-neutral-300 bg-neutral-200 text-neutral-500" :
                "border-neutral-200 text-neutral-400"
              }`}>
                {isDone ? (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : s.num}
              </span>
              <span className={`text-xs font-medium hidden sm:block transition-colors ${
                isActive ? "text-blue-600" : isDone ? "text-neutral-500" : "text-neutral-400"
              }`}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Terminal */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-5 pt-5 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border border-blue-100 text-blue-600 bg-blue-50">
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
          {step.terminal.map((line, i) => {
            if (line.t === "gap") return <div key={i} className="h-1" />;
            if (line.t === "cmd") return (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="text-emerald-400 shrink-0 select-none">$</span>
                <span className="text-neutral-200 break-all leading-relaxed">{line.v}</span>
              </div>
            );
            if (line.t === "ok") return (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="text-blue-400 shrink-0">✓</span>
                <span className="text-blue-300 leading-relaxed">{line.v}</span>
              </div>
            );
            if (line.t === "info") return (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="text-neutral-600 shrink-0 select-none">›</span>
                <span className="text-neutral-400 leading-relaxed">{line.v}</span>
              </div>
            );
            if (line.t === "dim") return (
              <div key={i} className="flex gap-2.5 items-start">
                <span className="text-neutral-700 leading-relaxed">{line.v}</span>
              </div>
            );
            return null;
          })}
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
