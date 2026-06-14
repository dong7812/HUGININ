from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from application.exceptions import AlreadyMemberError, InvalidInviteCodeError
from domain.entities.workspace import WorkspaceMember
from domain.repositories.workspace_repository import WorkspaceRepository


@dataclass
class JoinWorkspaceInput:
    invite_code: str
    user_id: UUID


@dataclass
class JoinWorkspaceOutput:
    workspace_id: str
    role: str


class JoinWorkspaceUseCase:
    def __init__(self, workspace_repo: WorkspaceRepository) -> None:
        self._workspace_repo = workspace_repo

    async def execute(self, input: JoinWorkspaceInput) -> JoinWorkspaceOutput:
        invite = await self._workspace_repo.find_invite(input.invite_code)
        if not invite or invite.is_expired() or invite.is_used():
            raise InvalidInviteCodeError("Invite code is invalid or expired")

        existing = await self._workspace_repo.get_member(invite.workspace_id, input.user_id)
        if existing:
            raise AlreadyMemberError("Already a member of this workspace")

        member = WorkspaceMember(
            workspace_id=invite.workspace_id,
            user_id=input.user_id,
            role=invite.role,
            joined_at=datetime.utcnow(),
        )
        await self._workspace_repo.add_member(member)
        await self._workspace_repo.mark_invite_used(input.invite_code, input.user_id)

        return JoinWorkspaceOutput(
            workspace_id=str(invite.workspace_id),
            role=invite.role.value,
        )
