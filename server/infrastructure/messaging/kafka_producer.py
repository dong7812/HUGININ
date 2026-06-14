import json
from uuid import UUID

from aiokafka import AIOKafkaProducer

from application.ports.queue_port import QueuePort

_TOPIC = "huginin.decision.raw"


class KafkaProducer(QueuePort):
    def __init__(self, bootstrap_servers: str) -> None:
        self._bootstrap_servers = bootstrap_servers
        self._producer: AIOKafkaProducer | None = None

    async def start(self) -> None:
        self._producer = AIOKafkaProducer(
            bootstrap_servers=self._bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode(),
        )
        await self._producer.start()

    async def stop(self) -> None:
        if self._producer:
            await self._producer.stop()

    async def publish_event(self, event_id: UUID, workspace_id: UUID) -> None:
        if not self._producer:
            raise RuntimeError("KafkaProducer not started")
        await self._producer.send_and_wait(
            _TOPIC,
            value={"event_id": str(event_id), "workspace_id": str(workspace_id)},
            key=str(event_id).encode(),
        )
