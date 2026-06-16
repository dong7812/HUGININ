from __future__ import annotations

import asyncio
import logging

import asyncpg

logger = logging.getLogger(__name__)

_RETRY_DELAYS = [2, 4, 8, 16, 30]  # seconds


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
        is_internal = (
            "localhost" in self._dsn
            or "127.0.0.1" in self._dsn
            or ".railway.internal" in self._dsn
        )
        ssl = None if is_internal else "require"

        # 비밀번호 제외한 호스트 정보 로깅 (진단용)
        try:
            import urllib.parse as _up
            _p = _up.urlparse(self._dsn)
            logger.info("DB connecting → %s:%s%s (ssl=%s)", _p.hostname, _p.port, _p.path, ssl)
        except Exception:
            pass

        for attempt, delay in enumerate(_RETRY_DELAYS, start=1):
            try:
                self._pool = await asyncpg.create_pool(
                    self._dsn,
                    min_size=2,
                    max_size=10,
                    command_timeout=30,
                    ssl=ssl,
                )
                logger.info("Database connected (attempt %d)", attempt)
                return
            except Exception as exc:
                if attempt == len(_RETRY_DELAYS):
                    raise
                logger.warning(
                    "DB connect failed (attempt %d/%d): %s — retrying in %ds",
                    attempt, len(_RETRY_DELAYS), exc, delay,
                )
                await asyncio.sleep(delay)

    async def disconnect(self) -> None:
        if self._pool:
            await self._pool.close()
