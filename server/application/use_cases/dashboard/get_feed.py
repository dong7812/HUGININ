from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID


@dataclass
class FeedItem:
    event_id: UUID
    user_email: str
    project_name: str | None
    prompt_preview: str
    status: str
    created_at: datetime
    user_name: str = ""
    branch: str | None = None
    prompt_tokens: int | None = None
    response_tokens: int | None = None
    raw_response: str | None = None
    diff: str | None = None
    commit_hash: str | None = None
    comment_count: int = 0
    # ETL 분석 결과
    frame: str | None = None
    ai_contribution: float | None = None
    decision_summary: str | None = None
    decision_type: str | None = None
    # 풍부한 서사 필드
    what_was_built: str | None = None
    problem_solved: str | None = None
    ai_role: str | None = None
    tradeoffs: str | None = None
    rejected_alternatives: str | None = None
    implicit_constraints: str | None = None
    # GitHub PR 이벤트
    event_type: str = "commit"
    pr_number: int | None = None
    pr_url: str | None = None
    github_author: str | None = None


@dataclass
class FeedInput:
    workspace_id: UUID
    user_id: UUID
    limit: int = 15
    offset: int = 0
    branch: str | None = None
    date_from: datetime | None = None
    frame: str | None = None


@dataclass
class FeedOutput:
    items: list[FeedItem] = field(default_factory=list)
    total: int = 0


class GetFeedUseCase:
    def __init__(self, event_repo):
        self._events = event_repo

    async def execute(self, input: FeedInput) -> FeedOutput:
        items, total = await self._events.get_feed(
            workspace_id=input.workspace_id,
            limit=input.limit,
            offset=input.offset,
            branch=input.branch,
            date_from=input.date_from,
            frame=input.frame,
        )
        return FeedOutput(items=items, total=total)
