from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID, uuid4


@dataclass
class User:
    id: UUID
    email: str
    name: str
    password_hash: str
    created_at: datetime

    @staticmethod
    def create(email: str, name: str, password_hash: str) -> User:
        return User(
            id=uuid4(),
            email=email,
            name=name,
            password_hash=password_hash,
            created_at=datetime.utcnow(),
        )
