from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

from domain.entities.workspace import Workspace, WorkspaceMember, WorkspaceRole
from domain.repositories.workspace_repository import WorkspaceRepository


@dataclass
class CreateWorkspaceInput:
    name: str
    owner_id: UUID


@dataclass
class CreateWorkspaceOutput:
    workspace_id: str
    slug: str


class CreateWorkspaceUseCase:
    def __init__(self, workspace_repo: WorkspaceRepository) -> None:
        self._workspace_repo = workspace_repo

    async def execute(self, input: CreateWorkspaceInput) -> CreateWorkspaceOutput:
        workspace = Workspace.create(input.name, input.owner_id)
        await self._workspace_repo.save(workspace)

        owner_member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=input.owner_id,
            role=WorkspaceRole.OWNER,
            joined_at=datetime.now(timezone.utc),
        )
        await self._workspace_repo.add_member(owner_member)

        return CreateWorkspaceOutput(
            workspace_id=str(workspace.id),
            slug=workspace.slug,
        )
