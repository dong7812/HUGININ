from dataclasses import dataclass, field
from uuid import UUID


@dataclass
class DayCount:
    date: str  # YYYY-MM-DD
    count: int


@dataclass
class ActivityInput:
    workspace_id: UUID
    user_id: UUID
    days: int = 30


@dataclass
class ActivityOutput:
    daily: list[DayCount] = field(default_factory=list)


class GetActivityUseCase:
    def __init__(self, event_repo):
        self._events = event_repo

    async def execute(self, input: ActivityInput) -> ActivityOutput:
        rows = await self._events.get_daily_counts(
            workspace_id=input.workspace_id,
            days=input.days,
        )
        return ActivityOutput(daily=rows)
