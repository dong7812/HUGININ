from uuid import UUID
from application.ports.queue_port import QueuePort


class NullQueuePort(QueuePort):
    """Kafka 미설정 시 no-op — ETL은 asyncio.create_task로 직접 처리."""

    async def start(self) -> None:
        pass

    async def stop(self) -> None:
        pass

    async def publish_event(self, event_id: UUID, workspace_id: UUID) -> None:
        pass
