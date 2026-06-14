from uuid import UUID

import asyncpg

from application.use_cases.comment.list_comments import CommentItem
from domain.entities.comment import DecisionComment


class PgCommentRepository:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    async def save(self, comment: DecisionComment) -> None:
        await self._pool.execute(
            """
            INSERT INTO decision_comments (id, event_id, user_id, content, created_at)
            VALUES ($1, $2, $3, $4, $5)
            """,
            comment.id, comment.event_id, comment.user_id,
            comment.content, comment.created_at,
        )

    async def list_by_event(self, event_id: UUID) -> list[CommentItem]:
        rows = await self._pool.fetch(
            """
            SELECT c.id, c.content, c.created_at, u.email
            FROM decision_comments c
            JOIN users u ON u.id = c.user_id
            WHERE c.event_id = $1
            ORDER BY c.created_at ASC
            """,
            event_id,
        )
        return [
            CommentItem(
                comment_id=str(r["id"]),
                user_email=r["email"],
                content=r["content"],
                created_at=r["created_at"].isoformat(),
            )
            for r in rows
        ]
