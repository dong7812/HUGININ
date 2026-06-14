from dataclasses import dataclass
from uuid import UUID

from application.exceptions import NotFoundError, PermissionDeniedError, SoleOwnerError
from domain.entities.workspace import WorkspaceRole
from domain.repositories.workspace_repository import WorkspaceRepository


@dataclass
class ChangeRoleInput:
    workspace_id: UUID
    requester_id: UUID
    target_user_id: UUID
    new_role: WorkspaceRole


class ChangeRoleUseCase:
    def __init__(self, workspace_repo: WorkspaceRepository) -> None:
        self._workspace_repo = workspace_repo

    async def execute(self, input: ChangeRoleInput) -> None:
        requester = await self._workspace_repo.get_member(input.workspace_id, input.requester_id)
        if not requester:
            raise NotFoundError("Workspace not found")

        target = await self._workspace_repo.get_member(input.workspace_id, input.target_user_id)
        if not target:
            raise NotFoundError("Target user is not a member")

        # owner 역할 변경은 owner 본인만 가능 (양도)
        if input.new_role == WorkspaceRole.OWNER or target.role == WorkspaceRole.OWNER:
            if not requester.role.can_change_role():
                raise PermissionDeniedError("Only the owner can transfer ownership")
        elif not requester.role.can_manage_members():
            raise PermissionDeniedError("Only owner or admin can change roles")

        # owner가 자신의 역할을 낮추려면 다른 owner가 있어야 함
        if (
            target.user_id == input.requester_id
            and target.role == WorkspaceRole.OWNER
            and input.new_role != WorkspaceRole.OWNER
        ):
            members = await self._workspace_repo.list_members(input.workspace_id)
            owner_count = sum(1 for m in members if m.role == WorkspaceRole.OWNER)
            if owner_count <= 1:
                raise SoleOwnerError("Transfer ownership before leaving")

        await self._workspace_repo.update_member_role(
            input.workspace_id, input.target_user_id, input.new_role
        )
