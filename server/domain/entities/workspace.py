from __future__ import annotations
import re
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from uuid import UUID, uuid4


class WorkspaceRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    GUEST = "guest"

    def can_manage_members(self) -> bool:
        return self in (WorkspaceRole.OWNER, WorkspaceRole.ADMIN)

    def can_change_role(self) -> bool:
        return self == WorkspaceRole.OWNER


@dataclass
class Workspace:
    id: UUID
    name: str
    slug: str
    owner_id: UUID
    created_at: datetime

    @staticmethod
    def create(name: str, owner_id: UUID) -> Workspace:
        base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "workspace"
        slug = f"{base}-{secrets.token_hex(4)}"
        return Workspace(
            id=uuid4(),
            name=name,
            slug=slug,
            owner_id=owner_id,
            created_at=datetime.utcnow(),
        )


@dataclass
class WorkspaceMember:
    workspace_id: UUID
    user_id: UUID
    role: WorkspaceRole
    joined_at: datetime


@dataclass
class InviteCode:
    code: str
    workspace_id: UUID
    role: WorkspaceRole
    created_by: UUID
    expires_at: datetime | None
    used_by: UUID | None

    @staticmethod
    def create(
        workspace_id: UUID,
        role: WorkspaceRole,
        created_by: UUID,
        expires_hours: int | None = 72,
    ) -> InviteCode:
        return InviteCode(
            code=secrets.token_urlsafe(16),
            workspace_id=workspace_id,
            role=role,
            created_by=created_by,
            expires_at=(
                datetime.utcnow() + timedelta(hours=expires_hours)
                if expires_hours
                else None
            ),
            used_by=None,
        )

    def is_expired(self) -> bool:
        return self.expires_at is not None and datetime.utcnow() > self.expires_at

    def is_used(self) -> bool:
        return self.used_by is not None
