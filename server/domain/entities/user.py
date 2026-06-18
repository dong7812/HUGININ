from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID, uuid4


@dataclass
class User:
    id: UUID
    email: str
    name: str
    password_hash: str
    created_at: datetime
    email_verified: bool = True
    verification_token: str | None = None
    google_id: str | None = None

    @staticmethod
    def create(email: str, name: str, password_hash: str, *, email_verified: bool = False) -> User:
        return User(
            id=uuid4(),
            email=email,
            name=name,
            password_hash=password_hash,
            created_at=datetime.now(timezone.utc),
            email_verified=email_verified,
        )

    @staticmethod
    def create_from_google(email: str, name: str, google_id: str) -> User:
        return User(
            id=uuid4(),
            email=email,
            name=name,
            password_hash="",
            created_at=datetime.now(timezone.utc),
            email_verified=True,
            google_id=google_id,
        )
