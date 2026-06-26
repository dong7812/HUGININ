import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FEATURES } from "../data";

export function generateStaticParams() {
  return FEATURES.map((f) => ({ id: f.id }));
}

function TermLine({ t, v = "" }: { t: string; v?: string }) {
  if (t === "gap")  return <div className="h-1" />;
  if (t === "cmd")  return <div className="flex gap-2.5"><span className="text-emerald-400 shrink-0 select-none">$</span><span className="text-neutral-200 break-all">{v}</span></div>;
  if (t === "ok")   return <div className="flex gap-2.5"><span className="text-emerald-400 shrink-0">✓</span><span className="text-emerald-300">{v}</span></div>;
  if (t === "info") return <div className="flex gap-2.5"><span className="text-neutral-600 shrink-0 select-none">›</span><span className="text-neutral-400">{v}</span></div>;
  if (t === "dim")  return <div className="text-neutral-700">{v}</div>;
  if (t === "tui-init")   return <div className="flex items-baseline gap-2"><span className="text-white font-bold">HUGININ</span><span className="text-neutral-600 text-[11px]">v0.1.0</span></div>;
  if (t === "tui-warn")   return <div className="flex gap-2"><span className="text-yellow-400 shrink-0">⚠</span><span className="text-yellow-300">{v}</span></div>;
  if (t === "tui-tool")   return <div className="flex gap-1"><span className="text-neutral-600">tool:</span><span className="text-white font-bold">{v}</span></div>;
  if (t === "tui-hint")   return <div className="text-neutral-600 text-[11px]">claude · agy · codex · setup · workspace · help · exit</div>;
  if (t === "tui-sep")    return <div className="text-neutral-700">{"─".repeat(44)}</div>;
  if (t === "tui-cmd")    return <div className="flex"><span className="text-blue-400 font-bold shrink-0">huginin</span><span className="text-neutral-600 shrink-0"> &gt; </span><span className="text-neutral-100">{v}</span></div>;
  if (t === "tui-prompt") return <div className="flex items-center"><span className="text-blue-400 font-bold">huginin</span><span className="text-neutral-600"> &gt; </span><span className="inline-block w-2 h-[14px] bg-neutral-400/60 rounded-sm" /></div>;
  return null;
}

export default async function FeaturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const feature = FEATURES.find((f) => f.id === id);
  if (!feature) notFound();

  const liveFeatures = FEATURES.filter((f) => f.group === "live");
  const currentIndex = liveFeatures.findIndex((f) => f.id === id);
  const prev = currentIndex > 0 ? liveFeatures[currentIndex - 1] : null;
  const next = currentIndex < liveFeatures.length - 1 ? liveFeatures[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <Image src="/web-app-manifest-192x192.png" alt="HUGININ" width={22} height={22} className="opacity-80" />
              <span className="font-mono font-bold text-neutral-900 tracking-widest text-[12px] uppercase">HUGININ</span>
            </Link>
            <span className="text-neutral-300">/</span>
            <Link href="/#features" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Features</Link>
            <span className="text-neutral-300">/</span>
            <span className="text-sm text-neutral-700 font-medium">{feature.title}</span>
          </div>
          <Link
            href="/#features"
            className="text-xs border border-neutral-200 hover:border-neutral-400 text-neutral-600 px-3 py-1.5 rounded-lg transition-all"
          >
            ← 목록으로
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">{feature.groupLabel}</span>
            <span className="text-neutral-200">·</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono border ${
              feature.group === "live"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-neutral-100 text-neutral-500 border-neutral-200"
            }`}>
              {feature.group === "live" ? "사용 가능" : "준비 중"}
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">{feature.title}</h1>
          <p className="text-xl text-neutral-500 leading-relaxed break-keep max-w-2xl">{feature.tagline}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Left column */}
          <div className="flex flex-col gap-10">
            {/* Scenario */}
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 font-mono">이런 상황에서</h2>
              <div className="border-l-2 border-neutral-200 pl-5 py-1">
                <p className="text-base text-neutral-700 leading-relaxed break-keep">{feature.scenario}</p>
              </div>
            </div>

            {/* Usage */}
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 font-mono">사용법</h2>
              <ol className="flex flex-col gap-3">
                {feature.usage.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-neutral-700 leading-relaxed font-mono">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-10">
            {/* Flow */}
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 font-mono">작동 방식</h2>
              <div className="flex flex-col gap-2">
                {feature.flow.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-neutral-100 last:border-0">
                    <span className="text-[10px] font-mono text-neutral-400 shrink-0 mt-0.5 w-4">{i + 1}</span>
                    <span className="text-sm text-neutral-600 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Details */}
            {feature.details && (
              <div className="flex flex-col gap-5">
                {feature.details.map((d) => (
                  <div key={d.label}>
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3 font-mono">{d.label}</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {d.values.map((v) => (
                        <span key={v} className="text-[11px] font-mono bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-md border border-neutral-200">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Terminal */}
            {feature.terminal && (
              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 font-mono">예시</h2>
                <div className="rounded-xl overflow-hidden border border-neutral-200">
                  <div className="bg-neutral-800 px-4 py-2.5 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
                  </div>
                  <div className="bg-neutral-900 px-5 py-4 font-mono text-[12px] space-y-1.5">
                    {feature.terminal.map((line, i) => (
                      <TermLine key={i} {...line} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prev / Next */}
        {(prev || next) && (
          <div className="mt-16 pt-8 border-t border-neutral-100 flex items-center justify-between gap-4">
            {prev ? (
              <Link
                href={`/features/${prev.id}`}
                className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors group"
              >
                <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                <div>
                  <p className="text-[10px] text-neutral-400 font-mono mb-0.5">이전</p>
                  <p className="font-medium">{prev.title}</p>
                </div>
              </Link>
            ) : <div />}
            {next ? (
              <Link
                href={`/features/${next.id}`}
                className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors group text-right"
              >
                <div>
                  <p className="text-[10px] text-neutral-400 font-mono mb-0.5">다음</p>
                  <p className="font-medium">{next.title}</p>
                </div>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            ) : <div />}
          </div>
        )}
      </main>
    </div>
  );
}
