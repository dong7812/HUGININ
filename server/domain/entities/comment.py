from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID, uuid4


@dataclass
class DecisionComment:
    id: UUID
    event_id: UUID
    user_id: UUID
    content: str
    created_at: datetime

    @staticmethod
    def create(event_id: UUID, user_id: UUID, content: str) -> DecisionComment:
        return DecisionComment(
            id=uuid4(),
            event_id=event_id,
            user_id=user_id,
            content=content,
            created_at=datetime.utcnow(),
        )
