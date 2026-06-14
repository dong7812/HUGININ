import type { ICommentRepository } from "@/domain/ports";
import type { Comment } from "@/domain/entities";
import { apiFetch } from "./apiClient";

class CommentApiRepository implements ICommentRepository {
  constructor(private readonly token: string) {}

  async listComments(eventId: string, workspaceId: string): Promise<Comment[]> {
    // API returns array directly: [{comment_id, user_email, content, created_at}]
    const items = await apiFetch<Array<{
      comment_id: string;
      user_email: string;
      content: string;
      created_at: string;
    }>>(`/decision/${eventId}/comments?workspace_id=${workspaceId}`, this.token);

    return items.map((c) => ({
      commentId: c.comment_id,
      userEmail: c.user_email,
      content: c.content,
      createdAt: c.created_at,
    }));
  }

  async addComment(eventId: string, workspaceId: string, content: string): Promise<Comment> {
    // API returns only {comment_id, created_at} — refetch via invalidateQueries fills the rest
    const data = await apiFetch<{ comment_id: string; created_at: string }>(
      `/decision/${eventId}/comment`,
      this.token,
      {
        method: "POST",
        body: JSON.stringify({ workspace_id: workspaceId, content }),
      }
    );

    return {
      commentId: data.comment_id,
      userEmail: "",
      content,
      createdAt: data.created_at,
    };
  }
}

export function createCommentRepository(token: string): ICommentRepository {
  return new CommentApiRepository(token);
}
