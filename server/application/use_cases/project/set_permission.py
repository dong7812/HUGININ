from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from application.exceptions import NotFoundError, PermissionDeniedError
from domain.entities.project import ProjectMember, ProjectPermission
from domain.entities.workspace import WorkspaceRole
from domain.repositories.project_repository import ProjectRepository
from domain.repositories.workspace_repository import WorkspaceRepository


@dataclass
class SetPermissionInput:
    project_id: UUID
    requester_id: UUID
    target_user_id: UUID
    permission: ProjectPermission


class SetPermissionUseCase:
    def __init__(
        self,
        project_repo: ProjectRepository,
        workspace_repo: WorkspaceRepository,
    ) -> None:
        self._project_repo = project_repo
        self._workspace_repo = workspace_repo

    async def execute(self, input: SetPermissionInput) -> None:
        project = await self._project_repo.find_by_id(input.project_id)
        if not project:
            raise NotFoundError("Project not found")

        requester = await self._workspace_repo.get_member(project.workspace_id, input.requester_id)
        if not requester or not requester.role.can_manage_members():
            raise PermissionDeniedError("Only owner or admin can set project permissions")

        await self._project_repo.upsert_member_permission(
            input.project_id, input.target_user_id, input.permission
        )
