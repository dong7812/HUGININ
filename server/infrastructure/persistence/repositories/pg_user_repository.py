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
            INSERT INTO users (id, email, name, password_hash, created_at)
            VALUES ($1, $2, $3, $4, $5)
            """,
            user.id, user.email, user.name, user.password_hash, user.created_at,
        )

    async def find_by_id(self, id: UUID) -> User | None:
        row = await self._pool.fetchrow("SELECT * FROM users WHERE id = $1", id)
        return self._to_entity(row) if row else None

    async def find_by_email(self, email: str) -> User | None:
        row = await self._pool.fetchrow("SELECT * FROM users WHERE email = $1", email)
        return self._to_entity(row) if row else None

    @staticmethod
    def _to_entity(row: asyncpg.Record) -> User:
        return User(
            id=row["id"],
            email=row["email"],
            name=row["name"],
            password_hash=row["password_hash"],
            created_at=row["created_at"],
        )
