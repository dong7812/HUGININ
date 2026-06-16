"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const STEPS = [
  {
    num: 1,
    label: "설치",
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
    title: "계정 연결",
    desc: "브라우저가 열리며 Google 계정으로 로그인한다.",
    lines: [
      { type: "cmd",  text: "huginin login" },
      { type: "info", text: "브라우저가 열립니다..." },
      { type: "ok",   text: "로그인 완료" },
    ],
    note: "토큰은 로컬 keychain에 저장됨",
  },
  {
    num: 3,
    label: "프로젝트 연결",
    title: "레포 연결",
    desc: "작업 중인 git 레포를 워크스페이스에 연결한다.",
    lines: [
      { type: "cmd",  text: "huginin project link" },
      { type: "info", text: "워크스페이스 선택 → HUGININ" },
      { type: "ok",   text: "프로젝트 연결 완료" },
    ],
    note: ".huginin/projects.json 에 저장됨",
  },
  {
    num: 4,
    label: "Hook 설치",
    title: "Git hook 설치",
    desc: "이제부터 커밋마다 자동으로 수집된다. 별도 입력 불필요.",
    lines: [
      { type: "cmd",  text: "huginin hook install" },
      { type: "ok",   text: "post-commit hook 설치됨" },
      { type: "info", text: "커밋마다 Claude Code 세션 자동 수집" },
    ],
    note: "기존 hook이 있으면 .bak으로 백업됨",
  },
];

export function InstallSlider() {
  const [current, setCurrent] = useState(0);
  const step = STEPS[current];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* 탭 헤더 */}
      <div className="flex border-b border-zinc-800">
        {STEPS.map((s, i) => (
          <button
            key={s.num}
            onClick={() => setCurrent(i)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 px-2 text-[10px] font-mono transition-colors border-b-2 ${
              i === current
                ? "border-violet-500 text-violet-300 bg-violet-950/20"
                : "border-transparent text-zinc-600 hover:text-zinc-400"
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
              i < current
                ? "bg-violet-600 border-violet-600 text-white"
                : i === current
                  ? "border-violet-500 text-violet-400"
                  : "border-zinc-700 text-zinc-600"
            }`}>
              {i < current ? <Check size={10} /> : s.num}
            </span>
            <span className="hidden sm:block">{s.label}</span>
          </button>
        ))}
      </div>

      {/* 본문 */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-1">{step.title}</h3>
          <p className="text-xs text-zinc-500">{step.desc}</p>
        </div>

        {/* 터미널 */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden mb-4">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-800/60">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <span className="ml-2 text-[10px] font-mono text-zinc-600">terminal</span>
          </div>
          <div className="p-4 font-mono text-sm space-y-1.5">
            {step.lines.map((line, i) => (
              <div key={i} className="flex items-start gap-2">
                {line.type === "cmd" && (
                  <>
                    <span className="text-green-400 shrink-0 mt-px">$</span>
                    <span className="text-zinc-200">{line.text}</span>
                  </>
                )}
                {line.type === "ok" && (
                  <>
                    <span className="text-emerald-400 shrink-0 mt-px">✓</span>
                    <span className="text-emerald-400/80">{line.text}</span>
                  </>
                )}
                {line.type === "info" && (
                  <>
                    <span className="text-zinc-600 shrink-0 mt-px">→</span>
                    <span className="text-zinc-500">{line.text}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] font-mono text-zinc-600 mb-6">{step.note}</p>

        {/* 네비게이션 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
            이전
          </button>

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

          {current < STEPS.length - 1 ? (
            <button
              onClick={() => setCurrent((c) => Math.min(STEPS.length - 1, c + 1))}
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              다음
              <ChevronRight size={14} />
            </button>
          ) : (
            <a
              href="/login"
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              시작하기
              <ChevronRight size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
