from datetime import timezone
from uuid import UUID

import asyncpg

from application.use_cases.dashboard.get_feed import FeedItem
from application.use_cases.dashboard.get_activity import DayCount
from domain.entities.event import DecisionEvent, EventStatus
from domain.repositories.event_repository import EventRepository


class PgEventRepository(EventRepository):
    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    async def save(self, event: DecisionEvent) -> None:
        await self._pool.execute(
            """
            INSERT INTO decision_events
                (id, workspace_id, project_id, user_id, commit_hash,
                 raw_prompt, raw_response, diff, status, created_at,
                 branch, prompt_tokens, response_tokens)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            """,
            event.id, event.workspace_id, event.project_id, event.user_id,
            event.commit_hash, event.raw_prompt, event.raw_response,
            event.diff, event.status.value, event.created_at,
            event.branch, event.prompt_tokens, event.response_tokens,
        )

    async def find_by_id(self, id: UUID) -> DecisionEvent | None:
        row = await self._pool.fetchrow(
            "SELECT * FROM decision_events WHERE id = $1", id
        )
        return self._to_entity(row) if row else None

    async def find_by_commit_hash(self, commit_hash: str) -> DecisionEvent | None:
        row = await self._pool.fetchrow(
            "SELECT * FROM decision_events WHERE commit_hash = $1", commit_hash
        )
        return self._to_entity(row) if row else None

    async def find_similar(
        self, embedding: list[float], workspace_id: UUID, limit: int = 10
    ) -> list[DecisionEvent]:
        # pgvector cosine distance — embedding 없는 행은 제외
        rows = await self._pool.fetch(
            """
            SELECT * FROM decision_events
            WHERE workspace_id = $1 AND embedding IS NOT NULL
            ORDER BY embedding <-> $2::vector
            LIMIT $3
            """,
            workspace_id, embedding, limit,
        )
        return [self._to_entity(r) for r in rows]

    async def count_by_workspace_since(self, workspace_id: UUID, days: int | None) -> int:
        if days is None:
            row = await self._pool.fetchrow(
                "SELECT COUNT(*) FROM decision_events WHERE workspace_id = $1",
                workspace_id,
            )
        else:
            row = await self._pool.fetchrow(
                """
                SELECT COUNT(*) FROM decision_events
                WHERE workspace_id = $1
                  AND created_at >= NOW() - ($2 || ' days')::INTERVAL
                """,
                workspace_id, str(days),
            )
        return row[0]

    async def get_feed(
        self,
        workspace_id: UUID,
        limit: int,
        offset: int,
        branch: str | None = None,
        date_from=None,
    ) -> tuple[list[FeedItem], int]:
        rows = await self._pool.fetch(
            """
            SELECT
                e.id, e.status, e.created_at,
                LEFT(e.raw_prompt, 120) AS prompt_preview,
                e.raw_response,
                e.diff,
                e.commit_hash,
                u.email AS user_email,
                p.name AS project_name,
                e.branch,
                e.prompt_tokens,
                e.response_tokens,
                e.frame,
                e.ai_contribution,
                e.decision_summary,
                e.decision_type,
                e.what_was_built,
                e.problem_solved,
                e.ai_role,
                (SELECT COUNT(*) FROM decision_comments dc WHERE dc.event_id = e.id)::int AS comment_count
            FROM decision_events e
            JOIN users u ON u.id = e.user_id
            LEFT JOIN projects p ON p.id = e.project_id
            WHERE e.workspace_id = $1
              AND ($4::text IS NULL OR e.branch = $4)
              AND ($5::timestamptz IS NULL OR e.created_at >= $5)
            ORDER BY e.created_at DESC
            LIMIT $2 OFFSET $3
            """,
            workspace_id, limit, offset, branch, date_from,
        )
        total_row = await self._pool.fetchrow(
            """
            SELECT COUNT(*) FROM decision_events
            WHERE workspace_id = $1
              AND ($2::text IS NULL OR branch = $2)
              AND ($3::timestamptz IS NULL OR created_at >= $3)
            """,
            workspace_id, branch, date_from,
        )
        items = [_to_feed_item(r) for r in rows]
        return items, total_row[0]

    async def search_events(
        self, workspace_id: UUID, query: str, limit: int = 20
    ) -> list[FeedItem]:
        pattern = f"%{query}%"
        rows = await self._pool.fetch(
            """
            SELECT
                e.id, e.status, e.created_at,
                LEFT(e.raw_prompt, 120) AS prompt_preview,
                e.raw_response, e.diff, e.commit_hash,
                u.email AS user_email, p.name AS project_name,
                e.branch, e.prompt_tokens, e.response_tokens,
                e.frame, e.ai_contribution, e.decision_summary, e.decision_type,
                e.what_was_built, e.problem_solved, e.ai_role,
                (SELECT COUNT(*) FROM decision_comments dc WHERE dc.event_id = e.id)::int AS comment_count
            FROM decision_events e
            JOIN users u ON u.id = e.user_id
            LEFT JOIN projects p ON p.id = e.project_id
            WHERE e.workspace_id = $1
              AND (e.raw_prompt ILIKE $2 OR e.raw_response ILIKE $2)
            ORDER BY e.created_at DESC
            LIMIT $3
            """,
            workspace_id, pattern, limit,
        )
        return [_to_feed_item(r) for r in rows]

    @staticmethod
    def _vec_str(embedding: list[float]) -> str:
        """asyncpg는 list를 pgvector에 직접 바인드할 수 없음 — 문자열로 직렬화."""
        return "[" + ",".join(str(x) for x in embedding) + "]"

    async def update_embedding(self, event_id: UUID, embedding: list[float]) -> None:
        await self._pool.execute(
            "UPDATE decision_events SET embedding = $1::vector WHERE id = $2",
            self._vec_str(embedding), event_id,
        )

    async def recall_across_workspaces(
        self, user_id: UUID, embedding: list[float], limit: int = 5
    ) -> list[FeedItem]:
        """유저가 속한 모든 워크스페이스에서 시맨틱 유사도 검색."""
        vec = self._vec_str(embedding)
        rows = await self._pool.fetch(
            """
            SELECT
                e.id, e.status, e.created_at,
                LEFT(e.raw_prompt, 120) AS prompt_preview,
                e.raw_response, e.diff, e.commit_hash,
                u.email AS user_email, p.name AS project_name,
                e.branch, e.prompt_tokens, e.response_tokens,
                e.frame, e.ai_contribution, e.decision_summary, e.decision_type,
                e.what_was_built, e.problem_solved, e.ai_role,
                (SELECT COUNT(*) FROM decision_comments dc WHERE dc.event_id = e.id)::int AS comment_count
            FROM decision_events e
            JOIN users u ON u.id = e.user_id
            LEFT JOIN projects p ON p.id = e.project_id
            JOIN workspace_members wm ON wm.workspace_id = e.workspace_id AND wm.user_id = $1
            WHERE e.embedding IS NOT NULL
            ORDER BY e.embedding <=> $2::vector
            LIMIT $3
            """,
            user_id, vec, limit,
        )
        return [_to_feed_item(r) for r in rows]

    async def list_branches(self, workspace_id: UUID) -> list[str]:
        rows = await self._pool.fetch(
            """
            SELECT DISTINCT branch FROM decision_events
            WHERE workspace_id = $1 AND branch IS NOT NULL
            ORDER BY branch
            """,
            workspace_id,
        )
        return [r["branch"] for r in rows]

    async def get_token_stats(
        self, workspace_id: UUID, days: int, branch: str | None = None
    ) -> list:
        from application.use_cases.dashboard.get_token_stats import TokenDay
        rows = await self._pool.fetch(
            """
            SELECT
                TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
                COALESCE(SUM(prompt_tokens), 0)::int   AS prompt_tokens,
                COALESCE(SUM(response_tokens), 0)::int AS response_tokens,
                COALESCE(SUM(prompt_tokens + response_tokens), 0)::int AS total_tokens
            FROM decision_events
            WHERE workspace_id = $1
              AND created_at >= NOW() - ($2 || ' days')::INTERVAL
              AND ($3::text IS NULL OR branch = $3)
            GROUP BY date
            ORDER BY date
            """,
            workspace_id, str(days), branch,
        )
        return [
            TokenDay(
                date=r["date"],
                prompt_tokens=r["prompt_tokens"],
                response_tokens=r["response_tokens"],
                total_tokens=r["total_tokens"],
            )
            for r in rows
        ]

    async def get_daily_counts(self, workspace_id: UUID, days: int) -> list[DayCount]:
        rows = await self._pool.fetch(
            """
            SELECT
                TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
                COUNT(*) AS count
            FROM decision_events
            WHERE workspace_id = $1
              AND created_at >= NOW() - ($2 || ' days')::INTERVAL
            GROUP BY date
            ORDER BY date
            """,
            workspace_id, str(days),
        )
        return [DayCount(date=r["date"], count=r["count"]) for r in rows]

    async def update_status(self, id: UUID, status: EventStatus) -> None:
        await self._pool.execute(
            "UPDATE decision_events SET status = $1 WHERE id = $2",
            status.value, id,
        )

    async def update_refined(
        self,
        id: UUID,
        frame: str,
        ai_contribution: float,
        decision_summary: str,
        decision_type: str,
        what_was_built: str = "",
        problem_solved: str = "",
        ai_role: str = "",
    ) -> None:
        await self._pool.execute(
            """
            UPDATE decision_events
            SET status = 'refined',
                frame = $2,
                ai_contribution = $3,
                decision_summary = $4,
                decision_type = $5,
                what_was_built = $6,
                problem_solved = $7,
                ai_role = $8
            WHERE id = $1
            """,
            id, frame, ai_contribution, decision_summary, decision_type,
            what_was_built, problem_solved, ai_role,
        )

    @staticmethod
    def _to_entity(row: asyncpg.Record) -> DecisionEvent:
        embedding = row["embedding"]
        return DecisionEvent(
            id=row["id"],
            workspace_id=row["workspace_id"],
            project_id=row["project_id"],
            user_id=row["user_id"],
            commit_hash=row["commit_hash"],
            raw_prompt=row["raw_prompt"],
            raw_response=row["raw_response"],
            diff=row["diff"],
            status=EventStatus(row["status"]),
            created_at=row["created_at"],
            branch=row.get("branch"),
            prompt_tokens=row.get("prompt_tokens"),
            response_tokens=row.get("response_tokens"),
            embedding=list(embedding) if embedding else None,
        )


def _to_feed_item(r: asyncpg.Record) -> "FeedItem":
    return FeedItem(
        event_id=r["id"],
        user_email=r["user_email"],
        project_name=r["project_name"],
        prompt_preview=r["prompt_preview"],
        status=r["status"],
        created_at=r["created_at"],
        branch=r["branch"],
        prompt_tokens=r["prompt_tokens"],
        response_tokens=r["response_tokens"],
        raw_response=r["raw_response"],
        diff=r["diff"],
        commit_hash=r["commit_hash"],
        comment_count=r["comment_count"],
        frame=r["frame"],
        ai_contribution=r["ai_contribution"],
        decision_summary=r["decision_summary"],
        decision_type=r["decision_type"],
        what_was_built=r["what_was_built"],
        problem_solved=r["problem_solved"],
        ai_role=r["ai_role"],
    )
