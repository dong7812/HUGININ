from abc import ABC, abstractmethod
from uuid import UUID


class QueuePort(ABC):
    @abstractmethod
    async def publish_event(self, event_id: UUID, workspace_id: UUID) -> None: ...
