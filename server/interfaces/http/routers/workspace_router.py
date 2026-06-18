from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status

from application.exceptions import (
    AlreadyMemberError, InvalidInviteCodeError,
    PermissionDeniedError, SoleOwnerError,
)
from application.use_cases.workspace.change_role import ChangeRoleInput
from application.use_cases.workspace.create_workspace import CreateWorkspaceInput
from application.use_cases.workspace.invite_member import InviteMemberInput
from application.use_cases.workspace.join_workspace import JoinWorkspaceInput
from interfaces.http.middleware.rbac_middleware import (
    get_current_user_id, require_workspace_admin, require_workspace_member,
)
from interfaces.http.schemas.workspace_schema import (
    ChangeRoleRequest, CreateWorkspaceRequest, CreateWorkspaceResponse,
    InviteMemberRequest, InviteMemberResponse, JoinWorkspaceRequest,
    JoinWorkspaceResponse, MemberResponse, WorkspaceResponse,
)

router = APIRouter(prefix="/workspace", tags=["workspace"])


@router.post("", response_model=CreateWorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    body: CreateWorkspaceRequest,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    result = await request.app.state.create_workspace_uc.execute(
        CreateWorkspaceInput(name=body.name, owner_id=user_id)
    )
    return CreateWorkspaceResponse(workspace_id=result.workspace_id, slug=result.slug)


@router.post("/join", response_model=JoinWorkspaceResponse)
async def join_workspace(
    body: JoinWorkspaceRequest,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        result = await request.app.state.join_workspace_uc.execute(
            JoinWorkspaceInput(invite_code=body.invite_code, user_id=user_id)
        )
    except InvalidInviteCodeError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except AlreadyMemberError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return JoinWorkspaceResponse(workspace_id=result.workspace_id, role=result.role)


@router.get("", response_model=list[WorkspaceResponse])
async def list_workspaces(request: Request, user_id: UUID = Depends(get_current_user_id)):
    result = await request.app.state.list_workspaces_uc.execute(user_id)
    return [
        WorkspaceResponse(id=str(w.id), name=w.name, slug=w.slug)
        for w in result.workspaces
    ]


@router.post("/{workspace_id}/invite", response_model=InviteMemberResponse)
async def invite_member(
    workspace_id: UUID,
    body: InviteMemberRequest,
    request: Request,
    member=Depends(require_workspace_admin),
):
    try:
        result = await request.app.state.invite_member_uc.execute(
            InviteMemberInput(
                workspace_id=workspace_id,
                requester_id=member.user_id,
                role=body.role,
                expires_hours=body.expires_hours,
            )
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    return InviteMemberResponse(code=result.code, role=result.role, expires_at=result.expires_at)


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: UUID,
    request: Request,
    member=Depends(require_workspace_admin),
):
    if member.role.value != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only owner can delete workspace")
    await request.app.state.workspace_repo.delete(workspace_id)


@router.get("/{workspace_id}/members", response_model=list[MemberResponse])
async def list_members(
    workspace_id: UUID,
    request: Request,
    _member=Depends(require_workspace_member),
):
    members = await request.app.state.workspace_repo.list_members(workspace_id)
    return [
        MemberResponse(
            user_id=str(m.user_id),
            role=m.role.value,
            joined_at=m.joined_at.isoformat(),
        )
        for m in members
    ]


@router.patch("/{workspace_id}/role")
async def change_role(
    workspace_id: UUID,
    body: ChangeRoleRequest,
    request: Request,
    member=Depends(require_workspace_member),
):
    try:
        await request.app.state.change_role_uc.execute(
            ChangeRoleInput(
                workspace_id=workspace_id,
                requester_id=member.user_id,
                target_user_id=body.target_user_id,
                new_role=body.new_role,
            )
        )
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except SoleOwnerError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return {"ok": True}
