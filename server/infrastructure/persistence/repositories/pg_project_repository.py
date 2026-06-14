from uuid import UUID

import asyncpg

from domain.entities.project import Project, ProjectMember, ProjectPermission
from domain.repositories.project_repository import ProjectRepository


class PgProjectRepository(ProjectRepository):
    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    async def save(self, project: Project) -> None:
        await self._pool.execute(
            """
            INSERT INTO projects (id, workspace_id, name, git_remote, created_at)
            VALUES ($1, $2, $3, $4, $5)
            """,
            project.id, project.workspace_id, project.name,
            project.git_remote, project.created_at,
        )

    async def find_by_id(self, id: UUID) -> Project | None:
        row = await self._pool.fetchrow("SELECT * FROM projects WHERE id = $1", id)
        return self._to_project(row) if row else None

    async def find_by_workspace(self, workspace_id: UUID) -> list[Project]:
        rows = await self._pool.fetch(
            "SELECT * FROM projects WHERE workspace_id = $1 ORDER BY created_at DESC",
            workspace_id,
        )
        return [self._to_project(r) for r in rows]

    async def count_by_workspace(self, workspace_id: UUID) -> int:
        row = await self._pool.fetchrow(
            "SELECT COUNT(*) FROM projects WHERE workspace_id = $1",
            workspace_id,
        )
        return row[0]

    async def update_git_remote(self, id: UUID, git_remote: str) -> None:
        await self._pool.execute(
            "UPDATE projects SET git_remote = $1 WHERE id = $2",
            git_remote, id,
        )

    async def add_member(self, member: ProjectMember) -> None:
        await self._pool.execute(
            """
            INSERT INTO project_members (project_id, user_id, permission, granted_at)
            VALUES ($1, $2, $3, $4)
            """,
            member.project_id, member.user_id, member.permission.value, member.granted_at,
        )

    async def get_member(self, project_id: UUID, user_id: UUID) -> ProjectMember | None:
        row = await self._pool.fetchrow(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            project_id, user_id,
        )
        return self._to_member(row) if row else None

    async def upsert_member_permission(
        self, project_id: UUID, user_id: UUID, permission: ProjectPermission
    ) -> None:
        await self._pool.execute(
            """
            INSERT INTO project_members (project_id, user_id, permission, granted_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (project_id, user_id)
            DO UPDATE SET permission = EXCLUDED.permission, granted_at = NOW()
            """,
            project_id, user_id, permission.value,
        )

    async def list_members(self, project_id: UUID) -> list[ProjectMember]:
        rows = await self._pool.fetch(
            "SELECT * FROM project_members WHERE project_id = $1 ORDER BY granted_at",
            project_id,
        )
        return [self._to_member(r) for r in rows]

    @staticmethod
    def _to_project(row: asyncpg.Record) -> Project:
        return Project(
            id=row["id"],
            workspace_id=row["workspace_id"],
            name=row["name"],
            git_remote=row["git_remote"],
            created_at=row["created_at"],
        )

    @staticmethod
    def _to_member(row: asyncpg.Record) -> ProjectMember:
        return ProjectMember(
            project_id=row["project_id"],
            user_id=row["user_id"],
            permission=ProjectPermission(row["permission"]),
            granted_at=row["granted_at"],
        )
