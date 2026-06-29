"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useDocPendingQuery, useDocReviewMutation } from "@/application/queries/dashboardQueries";
import type { DocItem } from "@/infrastructure/http/dashboardRepository";

const STATUS_LABEL: Record<string, string> = {
  pending: "처리 중",
  consistent: "코드베이스: 일치",
  outdated: "코드베이스: 불일치 ⚠",
  unverifiable: "코드베이스: 없음",
  reviewed: "승인됨",
  rejected: "거부됨",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  consistent: "bg-green-100 text-green-800",
  outdated: "bg-red-100 text-red-800",
  unverifiable: "bg-neutral-100 text-neutral-500",
  reviewed: "bg-blue-100 text-blue-800",
  rejected: "bg-gray-200 text-gray-500",
};

export default function DocsReviewPage() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { data: items = [], isLoading } = useDocPendingQuery(workspaceId);
  const reviewMutation = useDocReviewMutation(workspaceId);
  const [selected, setSelected] = useState<DocItem | null>(null);
  const [editWhat, setEditWhat] = useState("");
  const [editWhy, setEditWhy] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? items : items.filter((i) => i.validation_status === filter);

  function openItem(item: DocItem) {
    setSelected(item);
    setEditWhat(item.what_was_decided ?? "");
    setEditWhy(item.why ?? "");
  }

  async function submit(status: "reviewed" | "rejected" | "outdated") {
    if (!selected) return;
    await reviewMutation.mutateAsync({
      eventId: selected.event_id,
      validation_status: status,
      what_was_decided: editWhat || undefined,
      why: editWhy || undefined,
    });
    setSelected(null);
  }

  const pending = items.filter((i) => i.validation_status === "pending").length;

  return (
    <div className="flex h-full">
      {/* 목록 */}
      <aside className="w-80 border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h1 className="font-semibold text-gray-900">임포트된 문서</h1>
          {pending > 0 && (
            <p className="text-sm text-yellow-700 mt-1">{pending}개 처리 중...</p>
          )}
          <div className="flex gap-1 mt-3 flex-wrap">
            {["all", "consistent", "unverifiable", "outdated", "reviewed", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  filter === s
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "all" ? "전체" : STATUS_LABEL[s] ?? s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <p className="p-4 text-sm text-gray-500">불러오는 중...</p>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="p-4 text-sm text-gray-500">항목 없음</p>
          )}
          {filtered.map((item) => (
            <button
              key={item.event_id}
              onClick={() => openItem(item)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                selected?.event_id === item.event_id ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    STATUS_COLOR[item.validation_status ?? "pending"]
                  }`}
                >
                  {STATUS_LABEL[item.validation_status ?? "pending"]}
                </span>
                <span className="text-xs text-gray-500 truncate">
                  {item.doc_path.split("/").pop()}
                </span>
              </div>
              <p className="text-sm text-gray-800 truncate">
                {item.what_was_decided ?? "(추출 대기 중)"}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* 상세 검토 패널 */}
      <main className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            왼쪽에서 항목을 선택하세요
          </div>
        ) : (
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500 font-mono">{selected.doc_path}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${
                    STATUS_COLOR[selected.validation_status ?? "pending"]
                  }`}
                >
                  {STATUS_LABEL[selected.validation_status ?? "pending"]}
                </span>
                {selected.validation_note && (
                  <span className="text-xs text-gray-400">— {selected.validation_note}</span>
                )}
              </div>
            </div>

            {/* 원본 섹션 */}
            <section>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                원본 섹션
              </h2>
              <pre className="bg-gray-50 border border-gray-200 rounded p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto max-h-64">
                {selected.section_content}
              </pre>
            </section>

            {/* ETL 추출 결과 (편집 가능) */}
            <section className="space-y-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                ETL 추출 결과 — 검토 후 승인
              </h2>

              <label className="block">
                <span className="text-xs font-medium text-gray-600">결정 내용</span>
                <textarea
                  value={editWhat}
                  onChange={(e) => setEditWhat(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded border border-gray-200 p-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                  placeholder="ETL 추출 대기 중..."
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-gray-600">이유</span>
                <textarea
                  value={editWhy}
                  onChange={(e) => setEditWhy(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded border border-gray-200 p-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                  placeholder="ETL 추출 대기 중..."
                />
              </label>

              {selected.alternatives && (
                <div>
                  <span className="text-xs font-medium text-gray-600">검토된 대안</span>
                  <p className="mt-1 text-sm text-gray-700 bg-gray-50 rounded p-2">
                    {selected.alternatives}
                  </p>
                </div>
              )}

              {selected.constraints && (
                <div>
                  <span className="text-xs font-medium text-gray-600">제약 조건</span>
                  <p className="mt-1 text-sm text-gray-700 bg-gray-50 rounded p-2">
                    {selected.constraints}
                  </p>
                </div>
              )}
            </section>

            {/* 액션 버튼 */}
            <div className="flex gap-3 pt-2 flex-wrap">
              <button
                onClick={() => submit("reviewed")}
                disabled={reviewMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                ✓ 내용 수정 후 저장
              </button>
              <button
                onClick={() => submit("outdated")}
                disabled={reviewMutation.isPending}
                className="px-4 py-2 bg-orange-100 text-orange-700 text-sm rounded hover:bg-orange-200 disabled:opacity-50 font-medium"
              >
                오래된 내용으로 표시
              </button>
              <button
                onClick={() => submit("rejected")}
                disabled={reviewMutation.isPending}
                className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded hover:bg-gray-200 disabled:opacity-50 font-medium"
              >
                KB에서 제외
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
