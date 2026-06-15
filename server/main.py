"""Composition Root — 모든 의존성을 조립하는 진입점."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import Settings
from infrastructure.messaging.kafka_producer import KafkaProducer
from infrastructure.persistence.database import Database
from infrastructure.persistence.repositories.pg_event_repository import PgEventRepository
from infrastructure.persistence.repositories.pg_project_repository import PgProjectRepository
from infrastructure.persistence.repositories.pg_user_repository import PgUserRepository
from infrastructure.persistence.repositories.pg_workspace_repository import PgWorkspaceRepository
from infrastructure.security.argon2_password_service import Argon2PasswordService
from infrastructure.security.jwt_service import JwtService
from infrastructure.security.pii_masker import RegexPiiMasker
from application.use_cases.auth.login import LoginUseCase
from application.use_cases.auth.register import RegisterUseCase
from application.use_cases.collect.collect_event import CollectEventUseCase
from application.use_cases.project.link_project import LinkProjectUseCase
from application.use_cases.project.set_permission import SetPermissionUseCase
from application.use_cases.workspace.change_role import ChangeRoleUseCase
from application.use_cases.workspace.create_workspace import CreateWorkspaceUseCase
from application.use_cases.workspace.invite_member import InviteMemberUseCase
from application.use_cases.workspace.join_workspace import JoinWorkspaceUseCase
from application.use_cases.workspace.list_workspaces import ListWorkspacesUseCase
from application.use_cases.dashboard.get_overview import GetOverviewUseCase
from application.use_cases.dashboard.get_feed import GetFeedUseCase
from application.use_cases.dashboard.get_activity import GetActivityUseCase
from application.use_cases.dashboard.get_token_stats import GetTokenStatsUseCase
from application.use_cases.dashboard.get_frame_stats import GetFrameStatsUseCase
from application.use_cases.comment.add_comment import AddCommentUseCase
from application.use_cases.comment.list_comments import ListCommentsUseCase
from infrastructure.persistence.repositories.pg_comment_repository import PgCommentRepository
from interfaces.http.routers.auth_router import router as auth_router
from interfaces.http.routers.collect_router import router as collect_router
from interfaces.http.routers.project_router import router as project_router
from interfaces.http.routers.comment_router import router as comment_router
from interfaces.http.routers.dashboard_router import router as dashboard_router
from interfaces.http.routers.memory_router import router as memory_router
from interfaces.http.routers.workspace_router import router as workspace_router
from interfaces.http.routers.webhook_router import router as webhook_router
from interfaces.mcp.mcp_adapter import mount_mcp

settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = Database(settings.database_url)
    await db.connect()

    kafka = KafkaProducer(settings.kafka_brokers)
    await kafka.start()

    # Repositories
    user_repo = PgUserRepository(db.pool)
    workspace_repo = PgWorkspaceRepository(db.pool)
    project_repo = PgProjectRepository(db.pool)
    event_repo = PgEventRepository(db.pool)
    comment_repo = PgCommentRepository(db.pool)

    # Ports
    jwt = JwtService(settings.jwt_secret)
    password = Argon2PasswordService()
    pii = RegexPiiMasker()

    # 라우터 의존성 조회용 state 등록
    app.state.token_port = jwt
    app.state.user_repo = user_repo
    app.state.workspace_repo = workspace_repo
    app.state.project_repo = project_repo

    # Use Cases
    app.state.register_uc = RegisterUseCase(user_repo, jwt, password)
    app.state.login_uc = LoginUseCase(user_repo, jwt, password)
    app.state.create_workspace_uc = CreateWorkspaceUseCase(workspace_repo)
    app.state.join_workspace_uc = JoinWorkspaceUseCase(workspace_repo)
    app.state.invite_member_uc = InviteMemberUseCase(workspace_repo)
    app.state.change_role_uc = ChangeRoleUseCase(workspace_repo)
    app.state.list_workspaces_uc = ListWorkspacesUseCase(workspace_repo)
    app.state.link_project_uc = LinkProjectUseCase(project_repo, workspace_repo)
    app.state.set_permission_uc = SetPermissionUseCase(project_repo, workspace_repo)
    app.state.collect_event_uc = CollectEventUseCase(
        event_repo, workspace_repo, project_repo, pii, kafka,
        anthropic_api_key=settings.anthropic_api_key,
    )
    app.state.event_repo = event_repo  # branches 직접 조회용
    app.state.anthropic_api_key = settings.anthropic_api_key
    app.state.github_webhook_secret = settings.github_webhook_secret
    app.state.get_overview_uc = GetOverviewUseCase(workspace_repo, project_repo, event_repo)
    app.state.get_feed_uc = GetFeedUseCase(event_repo)
    app.state.get_activity_uc = GetActivityUseCase(event_repo)
    app.state.get_token_stats_uc = GetTokenStatsUseCase(event_repo)
    app.state.get_frame_stats_uc = GetFrameStatsUseCase(event_repo)
    app.state.add_comment_uc = AddCommentUseCase(comment_repo, event_repo, workspace_repo)
    app.state.list_comments_uc = ListCommentsUseCase(comment_repo, event_repo, workspace_repo)

    # 서버 시작 시 미분석 이벤트 백필 (백그라운드)
    if settings.anthropic_api_key:
        import asyncio
        asyncio.create_task(_backfill_refinement(event_repo, settings.anthropic_api_key))

    yield

    await kafka.stop()
    await db.disconnect()


app = FastAPI(title="HUGININ", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(workspace_router)
app.include_router(project_router)
app.include_router(collect_router)
app.include_router(comment_router)
app.include_router(dashboard_router)
app.include_router(memory_router)
app.include_router(webhook_router)

mount_mcp(app)


async def _backfill_refinement(event_repo, api_key: str) -> None:
    """서버 시작 시 frame IS NULL인 이벤트를 순차적으로 ETL 분석."""
    import asyncio
    import logging
    from infrastructure.llm.claude_refiner import refine_event

    logger = logging.getLogger("huginin.backfill")

    try:
        rows = await event_repo._pool.fetch(
            """
            SELECT e.id, e.raw_prompt, e.raw_response, e.diff, u.name AS user_name
            FROM decision_events e
            JOIN users u ON u.id = e.user_id
            WHERE e.what_was_built IS NULL
            ORDER BY e.created_at DESC
            """
        )
        if not rows:
            return
        logger.info("Backfill: %d events need rich ETL", len(rows))
        for row in rows:
            result = await refine_event(row["raw_prompt"], row["raw_response"] or "", row["diff"], api_key, row["user_name"])
            if result:
                await event_repo.update_refined(
                    id=row["id"],
                    frame=result.get("frame", "B"),
                    ai_contribution=float(result.get("ai_contribution", 0.5)),
                    decision_summary=result.get("decision_summary", ""),
                    decision_type=result.get("decision_type", "other"),
                    what_was_built=result.get("what_was_built", ""),
                    problem_solved=result.get("problem_solved", ""),
                    ai_role=result.get("ai_role", ""),
                )
            await asyncio.sleep(0.5)  # API 레이트 리밋 여유
        logger.info("Backfill complete")
    except Exception as e:
        logging.getLogger("huginin.backfill").warning("Backfill error: %s", e)
