from uuid import UUID

from pydantic import BaseModel

from domain.entities.workspace import WorkspaceRole


class CreateWorkspaceRequest(BaseModel):
    name: str


class CreateWorkspaceResponse(BaseModel):
    workspace_id: str
    slug: str


class JoinWorkspaceRequest(BaseModel):
    invite_code: str


class JoinWorkspaceResponse(BaseModel):
    workspace_id: str
    role: str


class InviteMemberRequest(BaseModel):
    role: WorkspaceRole = WorkspaceRole.MEMBER
    expires_hours: int | None = 72


class InviteMemberResponse(BaseModel):
    code: str
    role: str
    expires_at: str | None


class ChangeRoleRequest(BaseModel):
    target_user_id: UUID
    new_role: WorkspaceRole


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    slug: str


class MemberResponse(BaseModel):
    user_id: str
    role: str
    joined_at: str
