from abc import ABC, abstractmethod
from uuid import UUID

from domain.entities.project import Project, ProjectMember, ProjectPermission


class ProjectRepository(ABC):
    @abstractmethod
    async def save(self, project: Project) -> None: ...

    @abstractmethod
    async def find_by_id(self, id: UUID) -> Project | None: ...

    @abstractmethod
    async def find_by_name(self, workspace_id: UUID, name: str) -> Project | None: ...

    @abstractmethod
    async def find_by_workspace(self, workspace_id: UUID) -> list[Project]: ...

    @abstractmethod
    async def update_git_remote(self, id: UUID, git_remote: str) -> None: ...

    @abstractmethod
    async def add_member(self, member: ProjectMember) -> None: ...

    @abstractmethod
    async def get_member(self, project_id: UUID, user_id: UUID) -> ProjectMember | None: ...

    @abstractmethod
    async def upsert_member_permission(
        self, project_id: UUID, user_id: UUID, permission: ProjectPermission
    ) -> None: ...

    @abstractmethod
    async def list_members(self, project_id: UUID) -> list[ProjectMember]: ...
