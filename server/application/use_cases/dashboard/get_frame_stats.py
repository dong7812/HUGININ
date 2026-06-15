from dataclasses import dataclass, field
from uuid import UUID


@dataclass
class MemberFrameStats:
    user_name: str
    user_email: str
    A: int = 0
    B: int = 0
    C: int = 0
    D: int = 0
    avg_ai: float = 0.0

    @property
    def total(self) -> int:
        return self.A + self.B + self.C + self.D


@dataclass
class FrameStatsOutput:
    distribution: dict[str, int] = field(default_factory=dict)  # {A:5, B:12, C:8, D:3}
    total: int = 0
    avg_ai_contribution: float = 0.0
    by_member: list[MemberFrameStats] = field(default_factory=list)


@dataclass
class FrameStatsInput:
    workspace_id: UUID
    user_id: UUID
    days: int = 30


class GetFrameStatsUseCase:
    def __init__(self, event_repo):
        self._events = event_repo

    async def execute(self, input: FrameStatsInput) -> FrameStatsOutput:
        rows = await self._events.get_frame_stats(input.workspace_id, input.days)

        distribution: dict[str, int] = {"A": 0, "B": 0, "C": 0, "D": 0}
        members: dict[str, MemberFrameStats] = {}
        total_ai = 0.0
        total = 0

        for r in rows:
            frame = r["frame"]
            count = r["count"]
            avg_ai = float(r["avg_ai"] or 0)
            user_email = r["user_email"]
            user_name = r["user_name"] or user_email.split("@")[0]

            if frame in distribution:
                distribution[frame] += count
                total += count
                total_ai += avg_ai * count

            if user_email not in members:
                members[user_email] = MemberFrameStats(user_name=user_name, user_email=user_email)
            m = members[user_email]
            if frame == "A": m.A += count
            elif frame == "B": m.B += count
            elif frame == "C": m.C += count
            elif frame == "D": m.D += count
            m.avg_ai = (m.avg_ai * (m.total - count) + avg_ai * count) / m.total if m.total > 0 else avg_ai

        avg_ai_contribution = total_ai / total if total > 0 else 0.0
        by_member = sorted(members.values(), key=lambda m: m.total, reverse=True)

        return FrameStatsOutput(
            distribution=distribution,
            total=total,
            avg_ai_contribution=avg_ai_contribution,
            by_member=by_member,
        )
