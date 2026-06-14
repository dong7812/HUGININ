from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status

from application.exceptions import NotFoundError, PermissionDeniedError
from application.use_cases.project.link_project import LinkProjectInput
from application.use_cases.project.set_permission import SetPermissionInput
from interfaces.http.middleware.rbac_middleware import get_current_user_id, require_project_access
from interfaces.http.schemas.event_schema import (
    LinkProjectRequest, LinkProjectResponse, SetPermissionRequest,
)

router = APIRouter(prefix="/project", tags=["project"])


@router.post("", response_model=LinkProjectResponse, status_code=status.HTTP_201_CREATED)
async def link_project(
    body: LinkProjectRequest,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        result = await request.app.state.link_project_uc.execute(
            LinkProjectInput(
                workspace_id=body.workspace_id,
                requester_id=user_id,
                name=body.name,
                git_remote=body.git_remote,
            )
        )
    except (NotFoundError, PermissionDeniedError) as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    return LinkProjectResponse(project_id=result.project_id, name=result.name)


@router.patch("/{project_id}/permission")
async def set_permission(
    project_id: UUID,
    body: SetPermissionRequest,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
    _project=Depends(require_project_access),
):
    try:
        await request.app.state.set_permission_uc.execute(
            SetPermissionInput(
                project_id=project_id,
                requester_id=user_id,
                target_user_id=body.target_user_id,
                permission=body.permission,
            )
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    return {"ok": True}
