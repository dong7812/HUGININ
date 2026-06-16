"""fastembed 기반 임베딩 서비스 — intfloat/multilingual-e5-small (384d, 한국어 지원).

첫 호출 시 모델 다운로드. 이후 메모리 캐시. CPU 전용.
"""
import asyncio
from typing import ClassVar

_MODEL_NAME = "intfloat/multilingual-e5-small"


class EmbeddingService:
    _model: ClassVar = None

    @classmethod
    def _load(cls):
        if cls._model is None:
            from fastembed import TextEmbedding
            cls._model = TextEmbedding(_MODEL_NAME)
        return cls._model

    @classmethod
    async def embed(cls, text: str) -> list[float]:
        """텍스트 → 384차원 float 리스트. 스레드풀에서 실행."""
        loop = asyncio.get_event_loop()
        model = cls._load()
        vec = await loop.run_in_executor(
            None, lambda: next(iter(model.embed([text[:2048]])))
        )
        return vec.tolist()

    @classmethod
    async def embed_event(cls, prompt: str, response: str | None) -> list[float]:
        """raw prompt+response 임베딩 (수집 시점용)."""
        combined = prompt[:1500]
        if response:
            combined += "\n\n" + response[:500]
        return await cls.embed(combined)

    @classmethod
    async def embed_refined(
        cls, what_was_built: str, problem_solved: str, ai_role: str
    ) -> list[float]:
        """정제된 한국어 요약 기반 임베딩 (정확도 높음)."""
        parts = [p for p in [what_was_built, problem_solved, ai_role] if p]
        return await cls.embed("\n".join(parts)[:2048])
