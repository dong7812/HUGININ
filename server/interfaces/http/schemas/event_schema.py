from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from domain.entities.project import ProjectPermission


class CollectEventRequest(BaseModel):
    workspace_id: UUID
    raw_prompt: str
    raw_response: str
    project_id: UUID | None = None
    commit_hash: str | None = None
    diff: str | None = None
    branch: str | None = None
    prompt_tokens: int | None = None
    response_tokens: int | None = None
    committed_at: datetime | None = None
    ai_tool: str = "claude-code"


class CollectEventResponse(BaseModel):
    event_id: str
    status: str


class SetPermissionRequest(BaseModel):
    target_user_id: UUID
    permission: ProjectPermission


class LinkProjectRequest(BaseModel):
    workspace_id: UUID
    name: str
    git_remote: str | None = None


class LinkProjectResponse(BaseModel):
    project_id: str
    name: str
