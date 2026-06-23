"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "huginin_tour_v2_dismissed";

const STEPS = [
  {
    target: "timeline",
    title: "결정 타임라인",
    desc: "git commit마다 Claude와의 대화를 분석해 왜 이 결정을 했는지, 무엇을 만들었는지, 트레이드오프가 무엇인지를 자동으로 추출합니다. 코드나 git history에는 없는 맥락입니다.",
    side: "bottom" as const,
  },
  {
    target: "search",
    title: "시맨틱 검색",
    desc: '"왜 Redis 안 썼지?", "인증 어떻게 결정했지?" 같은 자연어로 과거 의사결정을 검색합니다. 커밋 메시지가 아닌 실제 대화 맥락 기반으로 찾습니다.',
    side: "bottom" as const,
  },
  {
    target: "export",
    title: "컨텍스트 추출",
    desc: "전체 의사결정 히스토리를 3단계 상세도로 Markdown 파일로 다운로드합니다. 새 AI 세션에 프로젝트 컨텍스트로 붙여넣거나 팀 온보딩 문서로 활용하세요.",
    side: "bottom" as const,
  },
  {
    target: "ai-chart",
    title: "AI 협업 분석",
    desc: "Frame A(Human-led)~D(Automated)로 내가 AI를 어떻게 쓰고 있는지 패턴을 파악합니다. 어떤 종류의 결정을 AI에게 맡기는지 트렌드를 확인하세요.",
    side: "left" as const,
  },
];

type Side = "top" | "bottom" | "left" | "right";

interface Rect { top: number; left: number; width: number; height: number }

function getTooltipStyle(rect: Rect, side: Side) {
  const GAP = 14;
  const W = 300;

  const clampLeft = (x: number) => Math.max(8, Math.min(x, window.innerWidth - W - 8));

  switch (side) {
    case "bottom":
      return { top: rect.top + rect.height + GAP, left: clampLeft(rect.left + rect.width / 2 - W / 2), width: W };
    case "top":
      return { top: rect.top - GAP - 140, left: clampLeft(rect.left + rect.width / 2 - W / 2), width: W };
    case "left":
      return { top: Math.max(8, rect.top + rect.height / 2 - 80), left: Math.max(8, rect.left - W - GAP), width: W };
    case "right":
      return { top: Math.max(8, rect.top + rect.height / 2 - 80), left: rect.left + rect.width + GAP, width: W };
  }
}

export function OnboardingModal() {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number>(0);

  const measureTarget = useCallback((stepIdx: number): boolean => {
    const el = document.querySelector(`[data-tour="${STEPS[stepIdx].target}"]`);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    return true;
  }, []);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!visible) return;

    // 즉시 측정 시도, 실패하면 DOM에 요소가 나타날 때까지 polling
    if (measureTarget(step)) return;

    const interval = setInterval(() => {
      if (measureTarget(step)) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [visible, step, measureTarget]);

  useEffect(() => {
    if (!visible || !rect) return;
    const onResize = () => measureTarget(step);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [visible, rect, step, measureTarget]);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function handleNext() {
    if (isLast) { setVisible(false); return; }
    setStep((s) => s + 1);
  }

  function handleDismissForever() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function handleClose() {
    setVisible(false);
  }

  const tooltipStyle = rect ? getTooltipStyle(rect, current.side) : undefined;
  const PAD = 8;

  return (
    <>
      {/* Overlay — solid dark except spotlight hole via box-shadow on the spotlight div */}
      <div className="fixed inset-0 z-40 pointer-events-none" style={{ background: "rgba(0,0,0,0)" }} />

      {/* Spotlight cutout: covers everything except target */}
      {rect && (
        <div
          className="fixed z-40 rounded-xl pointer-events-none transition-all duration-300"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            outline: "2px solid rgba(255,255,255,0.25)",
          }}
        />
      )}

      {/* Fallback full overlay when no rect found */}
      {!rect && <div className="fixed inset-0 z-40 bg-black/55" onClick={handleClose} />}

      {/* Tooltip */}
      {tooltipStyle && (
        <div
          className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-neutral-200 p-5 transition-all duration-300"
          style={tooltipStyle}
        >
          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-3">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-4 bg-neutral-800" : "w-1.5 bg-neutral-300"}`}
              />
            ))}
            <button onClick={handleClose} className="ml-auto p-0.5 text-neutral-400 hover:text-neutral-600">
              <X size={13} />
            </button>
          </div>

          <p className="text-sm font-bold text-neutral-900 mb-1.5">{current.title}</p>
          <p className="text-xs text-neutral-500 leading-relaxed mb-4">{current.desc}</p>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleDismissForever}
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              다시 안보기
            </button>
            <button
              onClick={handleNext}
              className="text-xs font-semibold bg-neutral-900 hover:bg-neutral-700 text-white rounded-lg px-4 py-2 transition-colors"
            >
              {isLast ? "완료" : "다음 →"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
