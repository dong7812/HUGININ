"""RBAC FastAPI 의존성 — 미들웨어가 아닌 Dependency로 구현해 테스트 용이성 확보."""
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status, Request

from application.exceptions import InvalidCredentialsError
from domain.entities.workspace import WorkspaceMember, WorkspaceRole
from domain.repositories.workspace_repository import WorkspaceRepository
from domain.repositories.project_repository import ProjectRepository


def get_token(authorization: str = Header(...)) -> str:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format")
    return token


def get_current_user_id(request: Request, token: str = Depends(get_token)) -> UUID:
    try:
        return request.app.state.token_port.decode_user_id(token)
    except InvalidCredentialsError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def require_workspace_member(
    workspace_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    request: Request = None,
) -> WorkspaceMember:
    repo: WorkspaceRepository = request.app.state.workspace_repo
    member = await repo.get_member(workspace_id, user_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return member


async def require_workspace_admin(
    member: WorkspaceMember = Depends(require_workspace_member),
) -> WorkspaceMember:
    if not member.role.can_manage_members():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    return member


async def require_project_access(
    project_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    request: Request = None,
):
    """guest의 미초대 프로젝트 접근 → 404로 존재 여부 노출 차단."""
    project_repo: ProjectRepository = request.app.state.project_repo
    workspace_repo: WorkspaceRepository = request.app.state.workspace_repo

    project = await project_repo.find_by_id(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    ws_member = await workspace_repo.get_member(project.workspace_id, user_id)
    if not ws_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    if ws_member.role == WorkspaceRole.GUEST:
        proj_member = await project_repo.get_member(project_id, user_id)
        if not proj_member:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    return project
