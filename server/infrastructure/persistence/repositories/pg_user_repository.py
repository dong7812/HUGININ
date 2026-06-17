from __future__ import annotations
from uuid import UUID

import asyncpg

from domain.entities.user import User
from domain.repositories.user_repository import UserRepository


class PgUserRepository(UserRepository):
    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    async def save(self, user: User) -> None:
        await self._pool.execute(
            """
            INSERT INTO users (id, email, name, password_hash, created_at,
                               email_verified, verification_token, google_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """,
            user.id, user.email, user.name, user.password_hash, user.created_at,
            user.email_verified, user.verification_token, user.google_id,
        )

    async def find_by_id(self, id: UUID) -> User | None:
        row = await self._pool.fetchrow("SELECT * FROM users WHERE id = $1", id)
        return self._to_entity(row) if row else None

    async def find_by_email(self, email: str) -> User | None:
        row = await self._pool.fetchrow("SELECT * FROM users WHERE email = $1", email)
        return self._to_entity(row) if row else None

    async def find_by_google_id(self, google_id: str) -> User | None:
        row = await self._pool.fetchrow("SELECT * FROM users WHERE google_id = $1", google_id)
        return self._to_entity(row) if row else None

    async def find_by_verification_token(self, token: str) -> User | None:
        row = await self._pool.fetchrow(
            "SELECT * FROM users WHERE verification_token = $1", token
        )
        return self._to_entity(row) if row else None

    async def verify_email(self, user_id: UUID) -> None:
        await self._pool.execute(
            "UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE id = $1",
            user_id,
        )

    async def set_google_id(self, user_id: UUID, google_id: str) -> None:
        await self._pool.execute(
            "UPDATE users SET google_id = $1 WHERE id = $2", google_id, user_id
        )

    # ── CLI auth session ──────────────────────────────────────────────────────

    async def create_cli_session(self) -> str:
        row = await self._pool.fetchrow(
            "INSERT INTO cli_auth_sessions DEFAULT VALUES RETURNING id"
        )
        return str(row["id"])

    async def complete_cli_session(self, session_id: str, user_id: UUID, jwt_token: str) -> None:
        await self._pool.execute(
            """
            UPDATE cli_auth_sessions
            SET user_id = $1, jwt_token = $2, status = 'complete'
            WHERE id = $3 AND status = 'pending' AND expires_at > NOW()
            """,
            user_id, jwt_token, UUID(session_id),
        )

    async def poll_cli_session(self, session_id: str) -> dict | None:
        row = await self._pool.fetchrow(
            """
            SELECT status, jwt_token, user_id
            FROM cli_auth_sessions
            WHERE id = $1 AND expires_at > NOW()
            """,
            UUID(session_id),
        )
        if not row:
            return None
        return {
            "status": row["status"],
            "token": row["jwt_token"],
            "user_id": str(row["user_id"]) if row["user_id"] else None,
        }

    @staticmethod
    def _to_entity(row: asyncpg.Record) -> User:
        return User(
            id=row["id"],
            email=row["email"],
            name=row["name"],
            password_hash=row["password_hash"],
            created_at=row["created_at"],
            email_verified=row.get("email_verified") if row.get("email_verified") is not None else True,
            verification_token=row.get("verification_token"),
            google_id=row.get("google_id"),
        )
