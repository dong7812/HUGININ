"use client";

import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useCommentsQuery, useAddCommentMutation } from "@/application/queries/dashboardQueries";

interface Props {
  eventId: string;
  workspaceId: string;
}

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
    <div className="mt-3 border-t border-neutral-100 pt-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <MessageSquare size={11} className="text-neutral-400" />
        <span className="text-[11px] text-neutral-500 font-semibold">코멘트</span>
        {comments && comments.length > 0 && (
          <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-md font-mono">{comments.length}</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 mb-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-8 bg-neutral-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-2.5 mb-3">
          {comments.map((c) => {
            const date = new Date(c.createdAt);
            const ts = date.toLocaleString("ko-KR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div key={c.commentId} className="flex gap-2.5">
                <span className="text-[10px] text-neutral-500 shrink-0 font-semibold pt-0.5">
                  {c.userEmail.split("@")[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-700 leading-relaxed">{c.content}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{ts}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-neutral-400 mb-3">아직 코멘트가 없습니다.</p>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="코멘트 추가..."
          className="flex-1 text-xs bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim() || isPending}
          className="p-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-400 hover:text-blue-600 hover:border-violet-200 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}
