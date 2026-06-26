import asyncio
from dataclasses import dataclass, field
from uuid import UUID

from domain.entities.event import DecisionEvent, EventStatus
from domain.repositories.event_repository import EventRepository
from domain.repositories.workspace_repository import WorkspaceRepository


@dataclass
class DocSection:
    heading: str
    content: str
    codebase_snippets: str = ""


@dataclass
class ImportDocInput:
    workspace_id: UUID
    user_id: UUID
    doc_path: str
    sections: list[DocSection] = field(default_factory=list)
    project_id: UUID | None = None


@dataclass
class ImportDocOutput:
    event_ids: list[str]
    section_count: int


class ImportDocUseCase:
    def __init__(
        self,
        event_repo: EventRepository,
        workspace_repo: WorkspaceRepository,
        anthropic_api_key: str = "",
    ) -> None:
        self._event_repo = event_repo
        self._workspace_repo = workspace_repo
        self._api_key = anthropic_api_key

    async def execute(self, inp: ImportDocInput) -> ImportDocOutput:
        from application.exceptions import NotFoundError
        member = await self._workspace_repo.get_member(inp.workspace_id, inp.user_id)
        if not member:
            raise NotFoundError("Workspace not found")

        event_ids = []
        for section in inp.sections:
            event = DecisionEvent.create(
                workspace_id=inp.workspace_id,
                user_id=inp.user_id,
                raw_prompt=section.content,
                raw_response="",
                project_id=inp.project_id,
            )
            # doc 전용 필드 오버라이드
            event.event_type = "doc_import"
            event.source_type = "doc"
            event.validation_status = "pending"
            event.doc_path = inp.doc_path
            event.status = EventStatus.PENDING

            await self._event_repo.save_doc(event)
            event_ids.append(str(event.id))

            if self._api_key:
                asyncio.create_task(
                    self._refine_section(event.id, section)
                )

        return ImportDocOutput(event_ids=event_ids, section_count=len(event_ids))

    async def _refine_section(self, event_id, section: DocSection) -> None:
        try:
            from infrastructure.llm.doc_refiner import refine_doc_section
            result = await refine_doc_section(
                section.heading, section.content, section.codebase_snippets, self._api_key
            )
            if result:
                await self._event_repo.update_doc_refined(
                    event_id=event_id,
                    what_was_decided=result.get("what_was_decided") or "",
                    why=result.get("why") or "",
                    alternatives=result.get("alternatives") or None,
                    constraints=result.get("constraints") or None,
                    decision_type=result.get("decision_type") or "other",
                    validation_status=result.get("validation_status") or "unverifiable",
                    validation_note=result.get("validation_note") or "",
                )
                # 임베딩
                from infrastructure.embedding.embedding_service import EmbeddingService
                vec = await EmbeddingService.embed_refined(
                    result.get("what_was_decided") or "",
                    result.get("why") or "",
                    "",
                )
                await self._event_repo.update_embedding(event_id, vec)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("doc refine failed %s: %s", event_id, exc)
