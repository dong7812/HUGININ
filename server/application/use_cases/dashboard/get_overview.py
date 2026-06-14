from dataclasses import dataclass
from uuid import UUID


@dataclass
class OverviewInput:
    workspace_id: UUID
    user_id: UUID


@dataclass
class OverviewOutput:
    member_count: int
    project_count: int
    events_today: int
    events_week: int
    events_total: int


class GetOverviewUseCase:
    def __init__(self, member_repo, project_repo, event_repo):
        self._members = member_repo
        self._projects = project_repo
        self._events = event_repo

    async def execute(self, input: OverviewInput) -> OverviewOutput:
        member_count = await self._members.count_by_workspace(input.workspace_id)
        project_count = await self._projects.count_by_workspace(input.workspace_id)
        events_today = await self._events.count_by_workspace_since(input.workspace_id, days=1)
        events_week = await self._events.count_by_workspace_since(input.workspace_id, days=7)
        events_total = await self._events.count_by_workspace_since(input.workspace_id, days=None)
        return OverviewOutput(
            member_count=member_count,
            project_count=project_count,
            events_today=events_today,
            events_week=events_week,
            events_total=events_total,
        )
