"use client";

import { useState } from "react";
import { Settings, Copy, Check, X, Trash2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/application/stores/authStore";
import { useWorkspaceStore } from "@/application/stores/workspaceStore";
import { apiInvite, apiDeleteWorkspace } from "@/infrastructure/http/apiClient";

interface Props {
  workspaceId: string;
}

export function WorkspaceSettings({ workspaceId }: Props) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const clearWorkspace = useWorkspaceStore((s) => s.clearWorkspace);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "invite" | "delete">("menu");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteExpiry, setInviteExpiry] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  function close() {
    setOpen(false);
    setView("menu");
    setInviteCode(null);
    setInviteExpiry(null);
    setCopied(false);
    setError(null);
    setDeleteConfirm("");
  }

  async function generateInvite() {
    if (!token) return;
    setLoadingInvite(true);
    setError(null);
    try {
      const res = await apiInvite(workspaceId, token);
      setInviteCode(res.code);
      setInviteExpiry(res.expires_at);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "초대코드 생성 실패");
    } finally {
      setLoadingInvite(false);
    }
  }

  async function copyCode() {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function deleteWorkspace() {
    if (!token) return;
    setLoadingDelete(true);
    setError(null);
    try {
      await apiDeleteWorkspace(workspaceId, token);
      clearWorkspace();
      router.push("/workspace/new");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "삭제 실패");
      setLoadingDelete(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
        title="워크스페이스 설정"
      >
        <Settings size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="font-semibold text-neutral-900">
                {view === "menu" && "워크스페이스 설정"}
                {view === "invite" && "초대 코드"}
                {view === "delete" && "워크스페이스 삭제"}
              </h2>
              <button onClick={close} className="text-neutral-400 hover:text-neutral-700 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {view === "menu" && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { setView("invite"); generateInvite(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors text-left"
                  >
                    <Copy size={16} className="text-blue-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">초대 코드 생성</p>
                      <p className="text-xs text-neutral-400 mt-0.5">팀원을 초대할 코드를 만듭니다 (72시간 유효)</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setView("delete")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-left"
                  >
                    <Trash2 size={16} className="text-red-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-700">워크스페이스 삭제</p>
                      <p className="text-xs text-red-400 mt-0.5">되돌릴 수 없습니다. 모든 데이터가 삭제됩니다.</p>
                    </div>
                  </button>
                </div>
              )}

              {view === "invite" && (
                <div className="flex flex-col gap-4">
                  {loadingInvite ? (
                    <div className="flex items-center justify-center py-8 text-neutral-400">
                      <RefreshCw size={20} className="animate-spin mr-2" />
                      생성 중...
                    </div>
                  ) : inviteCode ? (
                    <>
                      <div>
                        <p className="text-xs text-neutral-500 mb-2">초대 코드</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 font-mono text-sm text-neutral-900 tracking-wider select-all">
                            {inviteCode}
                          </code>
                          <button
                            onClick={copyCode}
                            className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                              copied
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                      {inviteExpiry && (
                        <p className="text-xs text-neutral-400">
                          만료: {new Date(inviteExpiry).toLocaleString("ko-KR")}
                        </p>
                      )}
                      <button
                        onClick={generateInvite}
                        className="text-xs text-neutral-400 hover:text-neutral-600 underline self-start transition-colors"
                      >
                        새 코드 재생성
                      </button>
                    </>
                  ) : error ? (
                    <p className="text-sm text-red-500">{error}</p>
                  ) : null}
                </div>
              )}

              {view === "delete" && (
                <div className="flex flex-col gap-4">
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <p className="text-sm text-red-700 font-medium mb-1">경고: 되돌릴 수 없습니다</p>
                    <p className="text-xs text-red-500 leading-relaxed">
                      워크스페이스와 관련된 모든 결정 기록, 멤버 데이터, 초대 코드가 영구 삭제됩니다.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-2">
                      확인을 위해 <span className="font-mono font-bold text-neutral-700">delete</span>를 입력하세요
                    </p>
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder="delete"
                      className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 transition-colors"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <button
                    onClick={deleteWorkspace}
                    disabled={deleteConfirm !== "delete" || loadingDelete}
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loadingDelete ? "삭제 중..." : "워크스페이스 영구 삭제"}
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {view !== "menu" && (
              <div className="px-6 pb-5">
                <button
                  onClick={() => { setView("menu"); setError(null); setDeleteConfirm(""); }}
                  className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  ← 돌아가기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
