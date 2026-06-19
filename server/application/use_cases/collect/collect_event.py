import asyncio
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from application.exceptions import DuplicateEventError, NotFoundError, PermissionDeniedError
from application.ports.pii_port import PiiPort
from application.ports.queue_port import QueuePort
from domain.entities.event import DecisionEvent
from domain.entities.project import ProjectPermission
from domain.entities.workspace import WorkspaceRole
from domain.repositories.event_repository import EventRepository
from domain.repositories.project_repository import ProjectRepository
from domain.repositories.workspace_repository import WorkspaceRepository


@dataclass
class CollectEventInput:
    workspace_id: UUID
    user_id: UUID
    raw_prompt: str
    raw_response: str
    user_name: str = ""
    project_id: UUID | None = None
    commit_hash: str | None = None
    diff: str | None = None
    branch: str | None = None
    prompt_tokens: int | None = None
    response_tokens: int | None = None
    committed_at: datetime | None = None


@dataclass
class CollectEventOutput:
    event_id: str
    status: str


class CollectEventUseCase:
    def __init__(
        self,
        event_repo: EventRepository,
        workspace_repo: WorkspaceRepository,
        project_repo: ProjectRepository,
        pii_port: PiiPort,
        queue_port: QueuePort,
        anthropic_api_key: str = "",
    ) -> None:
        self._event_repo = event_repo
        self._workspace_repo = workspace_repo
        self._project_repo = project_repo
        self._pii_port = pii_port
        self._queue_port = queue_port
        self._anthropic_api_key = anthropic_api_key

    async def execute(self, input: CollectEventInput) -> CollectEventOutput:
        member = await self._workspace_repo.get_member(input.workspace_id, input.user_id)
        if not member:
            raise NotFoundError("Workspace not found")
        if member.role == WorkspaceRole.GUEST:
            # guest는 직접 초대된 프로젝트만 수집 가능
            if not input.project_id:
                raise PermissionDeniedError("Guests must specify a project")
            proj_member = await self._project_repo.get_member(input.project_id, input.user_id)
            if not proj_member or not proj_member.permission.can_push():
                raise PermissionDeniedError("Insufficient project permission")

        # 멱등성: 동일 workspace 내 동일 commit_hash 재전송 차단
        if input.commit_hash:
            existing = await self._event_repo.find_by_commit_hash(input.commit_hash, input.workspace_id)
            if existing:
                raise DuplicateEventError(f"Event for {input.commit_hash} already collected")

        masked_prompt = self._pii_port.mask(input.raw_prompt)
        masked_response = self._pii_port.mask(input.raw_response)
        masked_diff = self._pii_port.mask(input.diff) if input.diff else None

        event = DecisionEvent.create(
            workspace_id=input.workspace_id,
            user_id=input.user_id,
            raw_prompt=masked_prompt,
            raw_response=masked_response,
            project_id=input.project_id,
            commit_hash=input.commit_hash,
            diff=masked_diff,
            branch=input.branch,
            prompt_tokens=input.prompt_tokens,
            response_tokens=input.response_tokens,
            committed_at=input.committed_at,
        )
        await self._event_repo.save(event)
        await self._queue_port.publish_event(event.id, input.workspace_id)

        # 백그라운드 작업 — 응답 속도에 영향 없음
        asyncio.create_task(self._embed_async(event.id, masked_prompt, masked_response))
        if self._anthropic_api_key:
            asyncio.create_task(
                self._refine_async(event.id, masked_prompt, masked_response, masked_diff, input.user_name)
            )

        return CollectEventOutput(event_id=str(event.id), status=event.status.value)

    async def _embed_async(self, event_id, prompt: str, response: str | None) -> None:
        try:
            from infrastructure.embedding.embedding_service import EmbeddingService
            vec = await EmbeddingService.embed_event(prompt, response)
            await self._event_repo.update_embedding(event_id, vec)
        except Exception:
            pass

    async def _refine_async(
        self, event_id, prompt: str, response: str, diff: str | None, user_name: str = ""
    ) -> None:
        try:
            from infrastructure.llm.claude_refiner import refine_event
            result = await refine_event(prompt, response, diff, self._anthropic_api_key, user_name)
            if result:
                what_was_built = result.get("what_was_built", "")
                problem_solved = result.get("problem_solved", "")
                ai_role = result.get("ai_role", "")
                tradeoffs = result.get("tradeoffs") or None
                await self._event_repo.update_refined(
                    id=event_id,
                    frame=result.get("frame", "B"),
                    ai_contribution=float(result.get("ai_contribution", 0.5)),
                    decision_summary=result.get("decision_summary", ""),
                    decision_type=result.get("decision_type", "other"),
                    what_was_built=what_was_built,
                    problem_solved=problem_solved,
                    ai_role=ai_role,
                    tradeoffs=tradeoffs,
                )
                # 정제된 한국어 내용으로 임베딩 재생성 — 검색 정확도 향상
                from infrastructure.embedding.embedding_service import EmbeddingService
                vec = await EmbeddingService.embed_refined(what_was_built, problem_solved, ai_role)
                await self._event_repo.update_embedding(event_id, vec)
        except Exception:
            pass  # 분석 실패가 수집을 막으면 안 됨
