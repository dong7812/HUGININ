"use client";

import { useEffect, useState } from "react";
import { X, GitCommit, Download, Search, BarChart2 } from "lucide-react";

const STORAGE_KEY = "huginin_onboarding_v1_dismissed";

const FEATURES = [
  {
    icon: GitCommit,
    color: "text-blue-500",
    bg: "bg-blue-50",
    title: "결정 타임라인",
    desc: "Claude Code 세션마다 AI와 나눈 대화를 분석해 왜 이 결정을 했는지, 무엇을 만들었는지, 어떤 트레이드오프가 있었는지를 자동으로 추출합니다. git에는 없는 맥락입니다.",
  },
  {
    icon: Search,
    color: "text-violet-500",
    bg: "bg-violet-50",
    title: "시맨틱 검색",
    desc: '"왜 Redis 안 썼지?", "인증 어떻게 결정했지?" 같은 자연어로 과거 의사결정을 검색합니다. 커밋 메시지가 아닌 실제 대화 맥락 기반으로 찾습니다.',
  },
  {
    icon: Download,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    title: "컨텍스트 추출",
    desc: "전체 의사결정 히스토리를 3단계 상세도로 Markdown 파일로 다운로드합니다. 새 AI 세션에 프로젝트 컨텍스트로 붙여넣거나 팀 온보딩 문서로 활용하세요.",
  },
  {
    icon: BarChart2,
    color: "text-amber-500",
    bg: "bg-amber-50",
    title: "AI 협업 분석",
    desc: "Frame A(Human-led)부터 D(Automated)까지 — 내가 AI를 어떻게 쓰고 있는지, 어떤 종류의 결정을 AI에게 맡기는지 패턴을 파악합니다.",
  },
];

export function OnboardingModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  function handleDismissForever() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function handleClose() {
    setVisible(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-5">
          <div>
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1.5">HUGININ</p>
            <h2 className="text-xl font-bold text-neutral-900 leading-snug">AI 의사결정 버전 컨트롤</h2>
            <p className="text-sm text-neutral-500 mt-1.5">
              코드와 git에는 없는 것 — <span className="text-neutral-700 font-medium">왜 이 결정을 했는지</span>를 기록합니다.
            </p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 shrink-0 ml-4">
            <X size={15} />
          </button>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-8 pb-8 overflow-y-auto">
          {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon size={15} className={color} />
              </div>
              <p className="text-sm font-semibold text-neutral-900 mb-1">{title}</p>
              <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-8 py-5 border-t border-neutral-100">
          <button
            onClick={handleDismissForever}
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors px-3 py-2"
          >
            다시 안보기
          </button>
          <button
            onClick={handleClose}
            className="text-sm font-medium bg-neutral-900 hover:bg-neutral-700 text-white rounded-xl px-5 py-2.5 transition-colors"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
