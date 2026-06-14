"""fastembed 기반 임베딩 서비스 — BAAI/bge-small-en-v1.5 (384d).

첫 호출 시 모델 다운로드 (~130MB). 이후 메모리 캐시.
CPU 전용, 외부 API 키 불필요.
"""
import asyncio
from typing import ClassVar


class EmbeddingService:
    _model: ClassVar = None  # lazy singleton — 프로세스당 1회 초기화

    @classmethod
    def _load(cls):
        if cls._model is None:
            from fastembed import TextEmbedding
            cls._model = TextEmbedding("BAAI/bge-small-en-v1.5")
        return cls._model

    @classmethod
    async def embed(cls, text: str) -> list[float]:
        """텍스트 → 384차원 float 리스트. 스레드풀에서 실행."""
        loop = asyncio.get_event_loop()
        model = cls._load()
        # fastembed는 동기 API — run_in_executor로 async 전환
        vec = await loop.run_in_executor(
            None, lambda: next(iter(model.embed([text[:2048]])))
        )
        return vec.tolist()

    @classmethod
    async def embed_event(cls, prompt: str, response: str | None) -> list[float]:
        """prompt + response를 합쳐 하나의 임베딩으로. 의미 밀도 최대화."""
        combined = prompt[:1500]
        if response:
            combined += "\n\n" + response[:500]
        return await cls.embed(combined)
