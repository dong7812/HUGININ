from dataclasses import dataclass, field
from uuid import UUID


@dataclass
class AiTrendBucket:
    bucket: str  # ISO datetime string (hour or day)
    avg_ai: float
    total: int
    frame_a: int = 0
    frame_b: int = 0
    frame_c: int = 0
    frame_d: int = 0


@dataclass
class AiTrendOutput:
    period: str  # "1d" | "7d" | "30d"
    buckets: list[AiTrendBucket] = field(default_factory=list)
    # 비교용: 이전 동일 기간 대비 변화
    current_avg_ai: float = 0.0
    prev_avg_ai: float = 0.0
    delta_pct: float = 0.0  # (current - prev) / prev * 100


@dataclass
class AiTrendInput:
    workspace_id: UUID
    user_id: UUID
    period: str = "7d"  # "1d" | "7d" | "30d"


class GetAiTrendUseCase:
    def __init__(self, event_repo):
        self._events = event_repo

    async def execute(self, input: AiTrendInput) -> AiTrendOutput:
        rows = await self._events.get_ai_trend(input.workspace_id, input.period)
        prev_rows = await self._events.get_ai_trend_prev(input.workspace_id, input.period)

        buckets = [
            AiTrendBucket(
                bucket=str(r["bucket"]),
                avg_ai=float(r["avg_ai"] or 0),
                total=int(r["total"]),
                frame_a=int(r["frame_a"]),
                frame_b=int(r["frame_b"]),
                frame_c=int(r["frame_c"]),
                frame_d=int(r["frame_d"]),
            )
            for r in rows
        ]

        current_avg = (
            sum(b.avg_ai * b.total for b in buckets) / sum(b.total for b in buckets)
            if buckets and sum(b.total for b in buckets) > 0 else 0.0
        )
        prev_total = sum(int(r["total"]) for r in prev_rows)
        prev_avg = (
            sum(float(r["avg_ai"] or 0) * int(r["total"]) for r in prev_rows) / prev_total
            if prev_total > 0 else 0.0
        )
        delta = ((current_avg - prev_avg) / prev_avg * 100) if prev_avg > 0 else 0.0

        return AiTrendOutput(
            period=input.period,
            buckets=buckets,
            current_avg_ai=current_avg,
            prev_avg_ai=prev_avg,
            delta_pct=round(delta, 1),
        )
