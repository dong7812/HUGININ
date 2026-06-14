from uuid import UUID

import asyncpg

from domain.entities.workspace import InviteCode, Workspace, WorkspaceMember, WorkspaceRole
from domain.repositories.workspace_repository import WorkspaceRepository


class PgWorkspaceRepository(WorkspaceRepository):
    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    async def save(self, workspace: Workspace) -> None:
        await self._pool.execute(
            """
            INSERT INTO workspaces (id, name, slug, owner_id, created_at)
            VALUES ($1, $2, $3, $4, $5)
            """,
            workspace.id, workspace.name, workspace.slug,
            workspace.owner_id, workspace.created_at,
        )

    async def find_by_id(self, id: UUID) -> Workspace | None:
        row = await self._pool.fetchrow("SELECT * FROM workspaces WHERE id = $1", id)
        return self._to_workspace(row) if row else None

    async def find_by_user(self, user_id: UUID) -> list[Workspace]:
        rows = await self._pool.fetch(
            """
            SELECT w.* FROM workspaces w
            JOIN workspace_members wm ON wm.workspace_id = w.id
            WHERE wm.user_id = $1
            ORDER BY w.created_at DESC
            """,
            user_id,
        )
        return [self._to_workspace(r) for r in rows]

    async def add_member(self, member: WorkspaceMember) -> None:
        await self._pool.execute(
            """
            INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
            VALUES ($1, $2, $3, $4)
            """,
            member.workspace_id, member.user_id, member.role.value, member.joined_at,
        )

    async def get_member(self, workspace_id: UUID, user_id: UUID) -> WorkspaceMember | None:
        row = await self._pool.fetchrow(
            "SELECT * FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
            workspace_id, user_id,
        )
        return self._to_member(row) if row else None

    async def update_member_role(
        self, workspace_id: UUID, user_id: UUID, role: WorkspaceRole
    ) -> None:
        await self._pool.execute(
            "UPDATE workspace_members SET role = $1 WHERE workspace_id = $2 AND user_id = $3",
            role.value, workspace_id, user_id,
        )

    async def list_members(self, workspace_id: UUID) -> list[WorkspaceMember]:
        rows = await self._pool.fetch(
            "SELECT * FROM workspace_members WHERE workspace_id = $1 ORDER BY joined_at",
            workspace_id,
        )
        return [self._to_member(r) for r in rows]

    async def count_by_workspace(self, workspace_id: UUID) -> int:
        row = await self._pool.fetchrow(
            "SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1",
            workspace_id,
        )
        return row[0]

    async def save_invite(self, invite: InviteCode) -> None:
        await self._pool.execute(
            """
            INSERT INTO invite_codes (code, workspace_id, role, created_by, expires_at, used_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            invite.code, invite.workspace_id, invite.role.value,
            invite.created_by, invite.expires_at, invite.used_by,
        )

    async def find_invite(self, code: str) -> InviteCode | None:
        row = await self._pool.fetchrow(
            "SELECT * FROM invite_codes WHERE code = $1", code
        )
        return self._to_invite(row) if row else None

    async def mark_invite_used(self, code: str, user_id: UUID) -> None:
        await self._pool.execute(
            "UPDATE invite_codes SET used_by = $1 WHERE code = $2",
            user_id, code,
        )

    @staticmethod
    def _to_workspace(row: asyncpg.Record) -> Workspace:
        return Workspace(
            id=row["id"],
            name=row["name"],
            slug=row["slug"],
            owner_id=row["owner_id"],
            created_at=row["created_at"],
        )

    @staticmethod
    def _to_member(row: asyncpg.Record) -> WorkspaceMember:
        return WorkspaceMember(
            workspace_id=row["workspace_id"],
            user_id=row["user_id"],
            role=WorkspaceRole(row["role"]),
            joined_at=row["joined_at"],
        )

    @staticmethod
    def _to_invite(row: asyncpg.Record) -> InviteCode:
        return InviteCode(
            code=row["code"],
            workspace_id=row["workspace_id"],
            role=WorkspaceRole(row["role"]),
            created_by=row["created_by"],
            expires_at=row["expires_at"],
            used_by=row["used_by"],
        )
