"use client";

import { useState, useEffect } from "react";
import { Sparkles, AlertTriangle, AlertCircle, Info, Clock, ArrowRight, X, ChevronDown, ChevronUp } from "lucide-react";
import { usePmBriefMutation } from "@/application/queries/dashboardQueries";
import type { PmBriefResult } from "@/infrastructure/http/dashboardRepository";

interface Props {
  workspaceId: string;
}

const SEVERITY_STYLE = {
  critical: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
  warning:  { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
  info:     { icon: Info, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
};

function getWeekKey() {
  const d = new Date();
  const year = d.getFullYear();
  const week = Math.ceil(((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
  return `${year}-W${week}`;
}

function storageKey(workspaceId: string) {
  return `huginin_brief_${workspaceId}_${getWeekKey()}`;
}

function getWeekLabel() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

export function PmBriefingButton({ workspaceId }: Props) {
  const [open, setOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const mutation = usePmBriefMutation(workspaceId);

  // 이번 주 브리핑이 없으면 자동 생성
  useEffect(() => {
    const key = storageKey(workspaceId);
    if (!localStorage.getItem(key) && !mutation.data && !mutation.isPending) {
      mutation.mutate(undefined, {
        onSuccess: () => {
          localStorage.setItem(key, new Date().toISOString());
          setIsNew(true);
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  function handleOpen() {
    setOpen(true);
    setIsNew(false);
    if (!mutation.data && !mutation.isPending) {
      mutation.mutate(undefined, {
        onSuccess: () => localStorage.setItem(storageKey(workspaceId), new Date().toISOString()),
      });
    }
  }

  function handleRegenerate() {
    localStorage.removeItem(storageKey(workspaceId));
    mutation.mutate(undefined, {
      onSuccess: () => localStorage.setItem(storageKey(workspaceId), new Date().toISOString()),
    });
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="relative flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
      >
        <Sparkles size={12} />
        AI 브리핑
        {(isNew || mutation.isPending) && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 border-2 border-white" />
        )}
      </button>

      {/* Slide-over panel */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-blue-500" />
                <span className="font-bold text-neutral-900">AI 브리핑</span>
                <span className="text-[10px] text-neutral-400 font-mono">{getWeekLabel()}</span>
              </div>
              <div className="flex items-center gap-2">
                {mutation.data && (
                  <button
                    onClick={handleRegenerate}
                    disabled={mutation.isPending}
                    className="text-xs text-neutral-500 hover:text-neutral-700 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-40"
                  >
                    재생성
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PmBriefContent mutation={mutation} onAnalyze={handleRegenerate} />
            </div>
          </div>
        </>
      )}
    </>
  );
}

function PmBriefContent({ mutation, onAnalyze }: {
  mutation: ReturnType<typeof usePmBriefMutation>;
  onAnalyze: () => void;
}) {
  const [staleOpen, setStaleOpen] = useState(false);
  const brief: PmBriefResult | undefined = mutation.data;

  if (mutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-700 mb-1">결정 패턴 분석 중</p>
          <p className="text-xs text-neutral-400">결정 데이터를 읽고 의견을 만들고 있어요</p>
        </div>
      </div>
    );
  }

  if (mutation.isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <p className="text-sm text-red-500 font-medium">분석 실패</p>
        <p className="text-xs text-neutral-400">정제된 결정이 부족하거나 일시적 오류입니다.</p>
        <button onClick={onAnalyze} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">다시 시도</button>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <Sparkles size={32} className="text-neutral-200" />
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-1">쌓인 결정을 PM처럼 분석</p>
          <p className="text-xs text-neutral-400 leading-relaxed">
            패턴, 미해결 트레이드오프,<br />놓친 영역을 찾아서 의견을 냅니다
          </p>
        </div>
        <button
          onClick={onAnalyze}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Sparkles size={14} />
          지금 분석하기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-100">
      {/* Summary */}
      <div className="px-6 py-5">
        <p className="text-sm text-neutral-700 leading-relaxed">{brief.summary}</p>
      </div>

      {/* Patterns */}
      {brief.patterns.length > 0 && (
        <div className="px-6 py-5 flex flex-col gap-3">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">발견된 패턴</p>
          {brief.patterns.map((p, i) => {
            const style = SEVERITY_STYLE[p.severity as keyof typeof SEVERITY_STYLE] ?? SEVERITY_STYLE.info;
            const Icon = style.icon;
            return (
              <div key={i} className={`rounded-xl border ${style.border} ${style.bg} p-4`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon size={13} className={style.color} />
                  <span className="text-xs font-bold text-neutral-800">{p.title}</span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{p.detail}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Next focus */}
      {brief.next_focus?.title && (
        <div className="px-6 py-5">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">다음 집중 포인트</p>
          <div className="bg-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight size={13} className="text-blue-200 shrink-0" />
              <span className="text-sm font-bold">{brief.next_focus.title}</span>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">{brief.next_focus.rationale}</p>
          </div>
        </div>
      )}

      {/* Stale tradeoffs */}
      {brief.stale_tradeoffs.length > 0 && (
        <div className="px-6 py-5">
          <button onClick={() => setStaleOpen(v => !v)} className="flex items-center gap-2 w-full mb-3">
            <Clock size={12} className="text-amber-500" />
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex-1 text-left">
              미해결 트레이드오프
            </p>
            <span className="text-[10px] font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
              {brief.stale_tradeoffs.length}개
            </span>
            {staleOpen ? <ChevronUp size={12} className="text-neutral-400" /> : <ChevronDown size={12} className="text-neutral-400" />}
          </button>
          {staleOpen && (
            <div className="flex flex-col gap-2.5">
              {brief.stale_tradeoffs.map((t, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-neutral-800">{t.decision}</span>
                    <span className="text-[10px] font-mono text-neutral-400">{t.made_at}</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">{t.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blind spots */}
      {brief.blind_spots.length > 0 && (
        <div className="px-6 py-5">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">논의되지 않은 영역</p>
          <div className="flex flex-col gap-2">
            {brief.blind_spots.map((b, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-neutral-300 mt-0.5">·</span>
                <p className="text-xs text-neutral-600 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
