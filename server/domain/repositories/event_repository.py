from abc import ABC, abstractmethod
from uuid import UUID

from domain.entities.event import DecisionEvent, EventStatus


class EventRepository(ABC):
    @abstractmethod
    async def save(self, event: DecisionEvent) -> None: ...

    @abstractmethod
    async def find_by_id(self, id: UUID) -> DecisionEvent | None: ...

    @abstractmethod
    async def find_by_commit_hash(self, commit_hash: str, workspace_id: UUID | None = None) -> DecisionEvent | None: ...

    @abstractmethod
    async def find_similar(
        self, embedding: list[float], workspace_id: UUID, limit: int = 10
    ) -> list[DecisionEvent]: ...

    @abstractmethod
    async def update_status(self, id: UUID, status: EventStatus) -> None: ...

    @abstractmethod
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
    ) -> None: ...
