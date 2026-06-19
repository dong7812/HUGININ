from dataclasses import dataclass
from uuid import UUID

from application.exceptions import NotFoundError, PermissionDeniedError
from domain.entities.project import Project
from domain.entities.workspace import WorkspaceRole
from domain.repositories.project_repository import ProjectRepository
from domain.repositories.workspace_repository import WorkspaceRepository


@dataclass
class LinkProjectInput:
    workspace_id: UUID
    requester_id: UUID
    name: str
    git_remote: str | None = None


@dataclass
class LinkProjectOutput:
    project_id: str
    name: str


class LinkProjectUseCase:
    def __init__(
        self,
        project_repo: ProjectRepository,
        workspace_repo: WorkspaceRepository,
    ) -> None:
        self._project_repo = project_repo
        self._workspace_repo = workspace_repo

    async def execute(self, input: LinkProjectInput) -> LinkProjectOutput:
        member = await self._workspace_repo.get_member(input.workspace_id, input.requester_id)
        if not member:
            raise NotFoundError("Workspace not found")
        if member.role == WorkspaceRole.GUEST:
            raise PermissionDeniedError("Guests cannot create projects")

        # workspace당 프로젝트는 하나 — 이미 있으면 그대로 반환 (git_remote만 업데이트)
        existing = await self._project_repo.find_by_workspace(input.workspace_id)
        if existing:
            project = existing[0]
            if input.git_remote and project.git_remote != input.git_remote:
                await self._project_repo.update_git_remote(project.id, input.git_remote)
            return LinkProjectOutput(project_id=str(project.id), name=project.name)

        project = Project.create(input.workspace_id, input.name, input.git_remote)
        await self._project_repo.save(project)

        return LinkProjectOutput(project_id=str(project.id), name=project.name)
