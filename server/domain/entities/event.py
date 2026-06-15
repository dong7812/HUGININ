from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4


class EventStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    REFINED = "refined"
    FAILED = "failed"


@dataclass
class DecisionEvent:
    id: UUID
    workspace_id: UUID
    project_id: UUID | None
    user_id: UUID
    commit_hash: str | None
    raw_prompt: str
    raw_response: str
    diff: str | None
    status: EventStatus
    created_at: datetime
    branch: str | None = field(default=None)
    prompt_tokens: int | None = field(default=None)
    response_tokens: int | None = field(default=None)
    embedding: list[float] | None = field(default=None)
    # ETL 분석 결과
    frame: str | None = field(default=None)            # A/B/C/D
    ai_contribution: float | None = field(default=None) # 0.0–1.0
    decision_summary: str | None = field(default=None)
    decision_type: str | None = field(default=None)
    # GitHub Webhook PR 이벤트
    event_type: str = field(default="commit")          # commit | pr_opened | pr_merged | pr_closed
    pr_number: int | None = field(default=None)
    pr_url: str | None = field(default=None)
    github_author: str | None = field(default=None)

    @staticmethod
    def create(
        workspace_id: UUID,
        user_id: UUID,
        raw_prompt: str,
        raw_response: str,
        project_id: UUID | None = None,
        commit_hash: str | None = None,
        diff: str | None = None,
        branch: str | None = None,
        prompt_tokens: int | None = None,
        response_tokens: int | None = None,
    ) -> DecisionEvent:
        # 토큰 수 미제공 시 텍스트 길이로 추정 (chars / 4)
        est_prompt = prompt_tokens if prompt_tokens is not None else max(1, len(raw_prompt) // 4)
        est_response = response_tokens if response_tokens is not None else max(1, len(raw_response) // 4)
        return DecisionEvent(
            id=uuid4(),
            workspace_id=workspace_id,
            project_id=project_id,
            user_id=user_id,
            commit_hash=commit_hash,
            raw_prompt=raw_prompt,
            raw_response=raw_response,
            diff=diff,
            status=EventStatus.PENDING,
            created_at=datetime.utcnow(),
            branch=branch,
            prompt_tokens=est_prompt,
            response_tokens=est_response,
            embedding=None,
        )
