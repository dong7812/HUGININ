from dataclasses import dataclass
from uuid import UUID

from domain.entities.workspace import Workspace
from domain.repositories.workspace_repository import WorkspaceRepository


@dataclass
class ListWorkspacesOutput:
    workspaces: list[Workspace]


class ListWorkspacesUseCase:
    def __init__(self, workspace_repo: WorkspaceRepository) -> None:
        self._workspace_repo = workspace_repo

    async def execute(self, user_id: UUID) -> ListWorkspacesOutput:
        workspaces = await self._workspace_repo.find_by_user(user_id)
        return ListWorkspacesOutput(workspaces=workspaces)
