from abc import ABC, abstractmethod
from uuid import UUID

from domain.entities.workspace import InviteCode, Workspace, WorkspaceMember, WorkspaceRole


class WorkspaceRepository(ABC):
    @abstractmethod
    async def save(self, workspace: Workspace) -> None: ...

    @abstractmethod
    async def find_by_id(self, id: UUID) -> Workspace | None: ...

    @abstractmethod
    async def find_by_user(self, user_id: UUID) -> list[Workspace]: ...

    @abstractmethod
    async def add_member(self, member: WorkspaceMember) -> None: ...

    @abstractmethod
    async def get_member(self, workspace_id: UUID, user_id: UUID) -> WorkspaceMember | None: ...

    @abstractmethod
    async def update_member_role(
        self, workspace_id: UUID, user_id: UUID, role: WorkspaceRole
    ) -> None: ...

    @abstractmethod
    async def list_members(self, workspace_id: UUID) -> list[WorkspaceMember]: ...

    @abstractmethod
    async def save_invite(self, invite: InviteCode) -> None: ...

    @abstractmethod
    async def find_invite(self, code: str) -> InviteCode | None: ...

    @abstractmethod
    async def mark_invite_used(self, code: str, user_id: UUID) -> None: ...
