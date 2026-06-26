import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FEATURES } from "./features/data";

const GROUP_ORDER = ["수집 · 기록", "탐색 · 활용", "AI 연동", "준비 중"];

export function FeatureExplorer() {
  const grouped = GROUP_ORDER.map((label) => ({
    label,
    features: FEATURES.filter((f) => f.groupLabel === label),
  })).filter((g) => g.features.length > 0);

  return (
    <section id="features" className="py-20 sm:py-28 px-5 sm:px-6 bg-white border-t border-neutral-100">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mb-4 font-mono">Features</p>
        <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-3 tracking-tight break-keep">
          지금 쓸 수 있는 것, 곧 나올 것
        </h2>
        <p className="text-sm text-neutral-500 mb-14 max-w-lg leading-relaxed break-keep">
          각 기능을 클릭하면 상세 설명과 사용법을 확인할 수 있다.
        </p>

        <div className="flex flex-col gap-12">
          {grouped.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 font-mono">
                {group.label}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.features.map((f) => (
                  f.group === "soon" ? (
                    <div
                      key={f.id}
                      className="rounded-2xl border border-neutral-100 bg-neutral-50 p-5 opacity-60"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 font-mono">soon</span>
                      </div>
                      <h3 className="text-sm font-bold text-neutral-500 mb-1.5">{f.title}</h3>
                      <p className="text-xs text-neutral-400 leading-relaxed">{f.tagline}</p>
                    </div>
                  ) : (
                    <Link
                      key={f.id}
                      href={`/features/${f.id}`}
                      className="group rounded-2xl border border-neutral-200 bg-white p-5 hover:border-neutral-900 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <ArrowRight size={13} className="text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <h3 className="text-sm font-bold text-neutral-900 mb-1.5">{f.title}</h3>
                      <p className="text-xs text-neutral-500 leading-relaxed">{f.tagline}</p>
                    </Link>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
