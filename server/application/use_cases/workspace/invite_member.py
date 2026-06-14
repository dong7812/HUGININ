from dataclasses import dataclass
from uuid import UUID

from application.exceptions import NotFoundError, PermissionDeniedError
from domain.entities.workspace import InviteCode, WorkspaceRole
from domain.repositories.workspace_repository import WorkspaceRepository


@dataclass
class InviteMemberInput:
    workspace_id: UUID
    requester_id: UUID
    role: WorkspaceRole
    expires_hours: int | None = 72


@dataclass
class InviteMemberOutput:
    code: str
    role: str
    expires_at: str | None


class InviteMemberUseCase:
    def __init__(self, workspace_repo: WorkspaceRepository) -> None:
        self._workspace_repo = workspace_repo

    async def execute(self, input: InviteMemberInput) -> InviteMemberOutput:
        requester = await self._workspace_repo.get_member(input.workspace_id, input.requester_id)
        if not requester:
            raise NotFoundError("Workspace not found")
        if not requester.role.can_manage_members():
            raise PermissionDeniedError("Only owner or admin can invite members")

        # owner 역할 초대코드는 발급 불가
        if input.role == WorkspaceRole.OWNER:
            raise PermissionDeniedError("Cannot invite with owner role")

        invite = InviteCode.create(
            workspace_id=input.workspace_id,
            role=input.role,
            created_by=input.requester_id,
            expires_hours=input.expires_hours,
        )
        await self._workspace_repo.save_invite(invite)

        return InviteMemberOutput(
            code=invite.code,
            role=invite.role.value,
            expires_at=invite.expires_at.isoformat() if invite.expires_at else None,
        )
