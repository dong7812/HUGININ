from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4


class ProjectPermission(str, Enum):
    FULL = "full"
    CONTRIBUTE = "contribute"
    COMMENT = "comment"
    VIEW = "view"

    def can_push(self) -> bool:
        return self in (ProjectPermission.FULL, ProjectPermission.CONTRIBUTE)

    def can_comment(self) -> bool:
        return self != ProjectPermission.VIEW


@dataclass
class Project:
    id: UUID
    workspace_id: UUID
    name: str
    git_remote: str | None
    created_at: datetime

    @staticmethod
    def create(workspace_id: UUID, name: str, git_remote: str | None = None) -> Project:
        return Project(
            id=uuid4(),
            workspace_id=workspace_id,
            name=name,
            git_remote=git_remote,
            created_at=datetime.now(timezone.utc),
        )


@dataclass
class ProjectMember:
    project_id: UUID
    user_id: UUID
    permission: ProjectPermission
    granted_at: datetime
