"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const STEPS = [
  {
    num: 1,
    label: "CLI 설치",
    title: "CLI 설치",
    desc: "바이너리 하나로 끝난다. 의존성 없음.",
    lines: [
      { type: "cmd",  text: "curl -sSL https://huginin.dev/install.sh | bash" },
      { type: "ok",   text: "huginin 설치 완료" },
    ],
    note: "macOS · Linux · WSL 지원",
  },
  {
    num: 2,
    label: "로그인",
    title: "계정 로그인",
    desc: "huginin.vercel.app 에서 회원가입 후 이메일 + 비밀번호로 로그인한다.",
    lines: [
      { type: "cmd",  text: "huginin login" },
      { type: "info", text: "Email: you@company.com" },
      { type: "info", text: "Password: ••••••••" },
      { type: "ok",   text: "로그인 완료" },
    ],
    note: "토큰은 로컬 keychain에 저장됨",
  },
  {
    num: 3,
    label: "프로젝트 연결",
    title: "레포 연결",
    desc: "작업 중인 git 레포를 대시보드 워크스페이스에 연결한다.",
    lines: [
      { type: "cmd",  text: "huginin project link" },
      { type: "info", text: "워크스페이스 선택 → my-workspace" },
      { type: "ok",   text: "프로젝트 연결 완료" },
    ],
    note: ".huginin/projects.json 에 저장됨",
  },
  {
    num: 4,
    label: "Hook 설치",
    title: "Git hook 설치",
    desc: "이제부터 커밋마다 Claude Code 세션이 자동으로 수집된다.",
    lines: [
      { type: "cmd",  text: "huginin hook install" },
      { type: "ok",   text: "post-commit hook 설치됨" },
      { type: "info", text: "커밋마다 자동 수집 시작" },
    ],
    note: "기존 hook이 있으면 .bak으로 백업됨",
  },
];

export function InstallSlider() {
  const [current, setCurrent] = useState(0);
  const step = STEPS[current];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col sm:flex-row min-h-[320px]">
      {/* 좌측 세로 메뉴 */}
      <div className="sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-r border-zinc-800 flex sm:flex-col flex-row">
        {STEPS.map((s, i) => (
          <button
            key={s.num}
            onClick={() => setCurrent(i)}
            className={`flex items-center gap-3 px-4 py-3.5 text-left w-full transition-colors border-b border-zinc-800/50 last:border-b-0 ${
              i === current
                ? "bg-violet-950/40 border-l-2 border-l-violet-500"
                : "hover:bg-zinc-800/40 border-l-2 border-l-transparent"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 border ${
              i < current
                ? "bg-violet-600 border-violet-600 text-white"
                : i === current
                  ? "border-violet-500 text-violet-400"
                  : "border-zinc-700 text-zinc-600"
            }`}>
              {i < current ? <Check size={9} /> : s.num}
            </span>
            <span className={`text-xs font-medium hidden sm:block ${
              i === current ? "text-violet-300" : i < current ? "text-zinc-400" : "text-zinc-600"
            }`}>
              {s.label}
            </span>
          </button>
        ))}
      </div>

      {/* 우측 카드 콘텐츠 */}
      <div className="flex-1 p-6 flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">
            Step {step.num} / {STEPS.length}
          </p>
          <h3 className="text-sm font-semibold text-zinc-200 mb-1">{step.title}</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">{step.desc}</p>
        </div>

        {/* 터미널 */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex-1">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-800/60">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <span className="ml-2 text-[10px] font-mono text-zinc-600">terminal</span>
          </div>
          <div className="p-4 font-mono text-sm space-y-2">
            {step.lines.map((line, i) => (
              <div key={i} className="flex items-start gap-2">
                {line.type === "cmd" && (
                  <>
                    <span className="text-green-400 shrink-0">$</span>
                    <span className="text-zinc-200 break-all">{line.text}</span>
                  </>
                )}
                {line.type === "ok" && (
                  <>
                    <span className="text-emerald-400 shrink-0">✓</span>
                    <span className="text-emerald-400/80">{line.text}</span>
                  </>
                )}
                {line.type === "info" && (
                  <>
                    <span className="text-zinc-600 shrink-0">→</span>
                    <span className="text-zinc-500">{line.text}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono text-zinc-600">{step.note}</p>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === current ? "bg-violet-400" : "bg-zinc-700 hover:bg-zinc-500"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
