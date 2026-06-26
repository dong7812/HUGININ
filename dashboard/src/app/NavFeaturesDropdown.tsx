"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { FEATURES } from "./features/data";

const GROUP_ORDER = ["수집 · 기록", "탐색 · 활용", "AI 연동"];

export function NavFeaturesDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const grouped = GROUP_ORDER.map((label) => ({
    label,
    features: FEATURES.filter((f) => f.groupLabel === label && f.group === "live"),
  }));

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-sm transition-colors ${
          open ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-900"
        }`}
      >
        UseCases
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[520px] bg-white border border-neutral-200 rounded-2xl shadow-xl shadow-neutral-900/10 overflow-hidden z-50">
          {/* Arrow */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-neutral-200 rotate-45" />

          <div className="grid grid-cols-3 divide-x divide-neutral-100 p-2">
            {grouped.map((group) => (
              <div key={group.label} className="px-2 py-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 px-2 py-1.5 font-mono">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.features.map((f) => (
                    <Link
                      key={f.id}
                      href={`/features/${f.id}`}
                      onClick={() => setOpen(false)}
                      className="flex flex-col gap-0.5 px-2 py-2 rounded-lg hover:bg-neutral-50 transition-colors group"
                    >
                      <span className="text-xs font-semibold text-neutral-900 group-hover:text-neutral-900">
                        {f.title}
                      </span>
                      <span className="text-[10px] text-neutral-400 leading-snug line-clamp-1">
                        {f.tagline}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-100 px-4 py-2.5 bg-neutral-50">
            <Link
              href="/#features"
              onClick={() => setOpen(false)}
              className="text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors font-mono"
            >
              전체 기능 보기 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
