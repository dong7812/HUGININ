"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, ChevronDown } from "lucide-react";
import { createDashboardRepository, type ChatHistoryItem } from "@/infrastructure/http/dashboardRepository";
import { useAuthStore } from "@/application/stores/authStore";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ id: string; what_was_built: string | null; created_at: string; frame: string | null }>;
}

const FRAME_COLOR: Record<string, string> = {
  A: "text-sky-600 bg-sky-50 border-sky-100",
  B: "text-blue-600 bg-blue-50 border-blue-100",
  C: "text-emerald-600 bg-emerald-50 border-emerald-100",
  D: "text-orange-600 bg-orange-50 border-orange-100",
};

const SUGGESTIONS = [
  "왜 이 기술 스택을 선택했어?",
  "최근에 미룬 결정이 있어?",
  "인증 방식은 왜 이렇게 됐어?",
  "AI가 가장 많이 기여한 부분은?",
];

export function DecisionChat({ workspaceId }: { workspaceId: string }) {
  const token = useAuthStore((s) => s.token) ?? "";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const repo = createDashboardRepository(token);
      const history: ChatHistoryItem[] = messages.map((m) => ({ role: m.role, content: m.content }));
      const result = await repo.chat(workspaceId, msg, history);
      const aiMsg: Message = { role: "assistant", content: result.reply, sources: result.sources };
      setMessages((prev) => [...prev, aiMsg]);
      if (!open) setUnread(true);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "잠시 오류가 발생했어요. 다시 시도해 주세요." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* 채팅 패널 */}
      <div className={`fixed bottom-20 right-5 z-50 flex flex-col w-[340px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-neutral-200 transition-all duration-200 origin-bottom-right ${
        open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
      }`}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white leading-none">HUGININ</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">결정 기록 기반 AI</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
            <ChevronDown size={18} />
          </button>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
          {messages.length === 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={11} className="text-white" />
                </div>
                <div className="bg-neutral-100 rounded-2xl rounded-tl-sm px-3 py-2.5 max-w-[240px]">
                  <p className="text-[13px] text-neutral-700 leading-relaxed">
                    안녕하세요! 저는 이 프로젝트의 결정 기록을 알고 있어요. 과거 결정에 대해 뭐든 물어보세요.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 ml-8">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[11px] text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-2.5 py-1 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={11} className="text-white" />
                </div>
              )}
              <div className="flex flex-col gap-1.5 max-w-[240px]">
                <div className={`rounded-2xl px-3 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-neutral-100 text-neutral-800 rounded-tl-sm"
                }`}>
                  {msg.content}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-col gap-1 ml-0.5">
                    {msg.sources.map((src) => (
                      <div key={src.id} className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-100 rounded-lg px-2 py-1">
                        {src.frame && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono ${FRAME_COLOR[src.frame] ?? ""}`}>
                            {src.frame}
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-500 truncate">{src.what_was_built ?? "결정 기록"}</span>
                        <span className="text-[9px] text-neutral-400 shrink-0">{src.created_at}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <Bot size={11} className="text-white" />
              </div>
              <div className="bg-neutral-100 rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 입력창 */}
        <div className="px-3 py-3 border-t border-neutral-100 shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="결정에 대해 물어보세요..."
              className="flex-1 bg-transparent text-[13px] text-neutral-900 placeholder:text-neutral-400 outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="text-blue-600 hover:text-blue-700 disabled:text-neutral-300 transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
            </button>
          </form>
          <p className="text-[10px] text-neutral-400 text-center mt-1.5">과거 결정 기록 기반으로 답해요</p>
        </div>
      </div>

      {/* Floating 버튼 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 w-13 h-13 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        style={{ width: 52, height: 52 }}
      >
        {open ? (
          <X size={20} />
        ) : (
          <div className="relative">
            <MessageCircle size={22} />
            {unread && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-neutral-900" />
            )}
          </div>
        )}
      </button>
    </>
  );
}
