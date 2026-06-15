from __future__ import annotations

import asyncpg


class Database:
    def __init__(self, dsn: str) -> None:
        self._dsn = dsn
        self._pool: asyncpg.Pool | None = None

    @property
    def pool(self) -> asyncpg.Pool:
        if self._pool is None:
            raise RuntimeError("Database not connected")
        return self._pool

    async def connect(self) -> None:
        is_local = "localhost" in self._dsn or "127.0.0.1" in self._dsn
        self._pool = await asyncpg.create_pool(
            self._dsn,
            min_size=2,
            max_size=10,
            command_timeout=30,
            ssl="require" if not is_local else None,
        )

    async def disconnect(self) -> None:
        if self._pool:
            await self._pool.close()
