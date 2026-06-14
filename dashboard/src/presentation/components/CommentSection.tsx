"use client";

import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useCommentsQuery, useAddCommentMutation } from "@/application/queries/dashboardQueries";

interface Props {
  eventId: string;
  workspaceId: string;
}

// SRP: 이벤트 코멘트 목록 + 입력만 담당
export function CommentSection({ eventId, workspaceId }: Props) {
  const [text, setText] = useState("");
  const { data: comments, isLoading } = useCommentsQuery(eventId, workspaceId, true);
  const { mutate, isPending } = useAddCommentMutation(eventId, workspaceId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    mutate(trimmed, {
      onSuccess: () => setText(""),
    });
  }

  return (
    <div className="mt-3 border-t border-zinc-800 pt-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <MessageSquare size={11} className="text-zinc-500" />
        <span className="text-[11px] text-zinc-500 font-medium">코멘트</span>
        {comments && comments.length > 0 && (
          <span className="text-[10px] text-zinc-600">({comments.length})</span>
        )}
      </div>

      {/* Comment list */}
      {isLoading ? (
        <div className="space-y-2 mb-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-8 bg-zinc-800 rounded animate-pulse" />
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-2 mb-3">
          {comments.map((c) => {
            const date = new Date(c.createdAt);
            const ts = date.toLocaleString("ko-KR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div key={c.commentId} className="flex gap-2">
                <span className="text-[10px] text-zinc-500 shrink-0 font-medium pt-0.5">
                  {c.userEmail.split("@")[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 leading-relaxed">{c.content}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{ts}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-zinc-600 mb-3">아직 코멘트가 없습니다.</p>
      )}

      {/* Add comment form */}
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="코멘트 추가..."
          className="flex-1 text-xs bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
        />
        <button
          type="submit"
          disabled={!text.trim() || isPending}
          className="p-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}
