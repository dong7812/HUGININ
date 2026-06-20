"""Composition Root — 모든 의존성을 조립하는 진입점. build:2026-06-19"""
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import Settings
from infrastructure.persistence.database import Database
from infrastructure.persistence.repositories.pg_event_repository import PgEventRepository
from infrastructure.persistence.repositories.pg_project_repository import PgProjectRepository
from infrastructure.persistence.repositories.pg_user_repository import PgUserRepository
from infrastructure.smtp.email_sender import EmailSender
from infrastructure.oauth.google_oauth import GoogleOAuth
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
from application.use_cases.dashboard.get_ai_trend import GetAiTrendUseCase
from application.use_cases.dashboard.get_cache_suggestions import GetCacheSuggestionsUseCase
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
from interfaces.http.routers.pm_brief_router import router as pm_brief_router
from interfaces.http.routers.chat_router import router as chat_router
from interfaces.mcp.mcp_adapter import mount_mcp

logger = logging.getLogger("huginin")
settings = Settings()


async def _run_migrations(pool) -> None:
    migrations_dir = Path(__file__).parent / "infrastructure" / "persistence" / "migrations"
    sql_files = sorted(migrations_dir.glob("*.sql"))
    async with pool.acquire() as conn:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        for f in sql_files:
            sql = f.read_text()
            try:
                await conn.execute(sql)
                logger.info("Migration applied: %s", f.name)
            except Exception as e:
                logger.warning("Migration %s skipped: %s", f.name, e)


def _build_queue(brokers: str):
    if not brokers:
        from infrastructure.messaging.null_queue import NullQueuePort
        return NullQueuePort()
    from infrastructure.messaging.kafka_producer import KafkaProducer
    return KafkaProducer(brokers)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = Database(settings.database_url)
    await db.connect()

    await _run_migrations(db.pool)

    queue = _build_queue(settings.kafka_brokers)
    await queue.start()

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
    # SMTP / OAuth
    email_sender = EmailSender(
        host=settings.smtp_host,
        port=settings.smtp_port,
        user=settings.smtp_user,
        password=settings.smtp_password,
        from_addr=settings.smtp_from,
    )
    google_oauth = GoogleOAuth(
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        redirect_uri=settings.google_redirect_uri,
    )
    app.state.google_oauth = google_oauth
    app.state.frontend_url = settings.frontend_url

    app.state.register_uc = RegisterUseCase(
        user_repo, jwt, password, email_sender=email_sender, frontend_url=settings.frontend_url
    )
    app.state.login_uc = LoginUseCase(user_repo, jwt, password)
    app.state.create_workspace_uc = CreateWorkspaceUseCase(workspace_repo)
    app.state.join_workspace_uc = JoinWorkspaceUseCase(workspace_repo)
    app.state.invite_member_uc = InviteMemberUseCase(workspace_repo)
    app.state.change_role_uc = ChangeRoleUseCase(workspace_repo)
    app.state.list_workspaces_uc = ListWorkspacesUseCase(workspace_repo)
    app.state.link_project_uc = LinkProjectUseCase(project_repo, workspace_repo)
    app.state.set_permission_uc = SetPermissionUseCase(project_repo, workspace_repo)
    app.state.collect_event_uc = CollectEventUseCase(
        event_repo, workspace_repo, project_repo, pii, queue,
        anthropic_api_key=settings.anthropic_api_key,
    )
    app.state.event_repo = event_repo
    app.state.anthropic_api_key = settings.anthropic_api_key
    app.state.github_webhook_secret = settings.github_webhook_secret
    app.state.get_overview_uc = GetOverviewUseCase(workspace_repo, project_repo, event_repo)
    app.state.get_feed_uc = GetFeedUseCase(event_repo)
    app.state.get_activity_uc = GetActivityUseCase(event_repo)
    app.state.get_token_stats_uc = GetTokenStatsUseCase(event_repo)
    app.state.get_frame_stats_uc = GetFrameStatsUseCase(event_repo)
    app.state.get_ai_trend_uc = GetAiTrendUseCase(event_repo)
    app.state.get_cache_suggestions_uc = GetCacheSuggestionsUseCase(event_repo)
    app.state.add_comment_uc = AddCommentUseCase(comment_repo, event_repo, workspace_repo)
    app.state.list_comments_uc = ListCommentsUseCase(comment_repo, event_repo, workspace_repo)

    if settings.anthropic_api_key:
        import asyncio
        if os.getenv("FORCE_REREFINE") == "1":
            await db.pool.execute(
                """
                UPDATE decision_events
                SET what_was_built = NULL, problem_solved = NULL, ai_role = NULL,
                    frame = NULL, ai_contribution = NULL, decision_summary = NULL,
                    decision_type = NULL, tradeoffs = NULL, status = 'pending'
                """
            )
            print("[FORCE_REREFINE] all ETL fields cleared — re-refine starting", flush=True)
        asyncio.create_task(_backfill_refinement(event_repo, settings.anthropic_api_key))
    asyncio.create_task(_backfill_embeddings(event_repo))

    yield

    await queue.stop()
    await db.disconnect()


app = FastAPI(title="HUGININ", version="0.1.0", lifespan=lifespan)

_origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
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
app.include_router(pm_brief_router)
app.include_router(chat_router)

mount_mcp(app)


@app.get("/health")
async def health():
    return {"status": "ok"}


async def _backfill_refinement(event_repo, api_key: str) -> None:
    import asyncio
    from infrastructure.llm.claude_refiner import refine_event

    try:
        rows = await event_repo._pool.fetch(
            """
            SELECT e.id, e.raw_prompt, e.raw_response, e.diff, u.name AS user_name
            FROM decision_events e
            JOIN users u ON u.id = e.user_id
            WHERE e.what_was_built IS NULL OR e.tradeoffs IS NULL
            ORDER BY e.created_at DESC
            """
        )
        if not rows:
            print("[Backfill] no pending events", flush=True)
            return
        print(f"[Backfill] starting {len(rows)} events", flush=True)
        ok = 0
        for i, row in enumerate(rows):
            result = await refine_event(
                row["raw_prompt"], row["raw_response"] or "", row["diff"], api_key, row["user_name"]
            )
            if result:
                try:
                    ai_contribution = float(result.get("ai_contribution", 0.5))
                except (TypeError, ValueError):
                    ai_contribution = 0.5
                frame = result.get("frame", "B")
                if frame not in ("A", "B", "C", "D"):
                    frame = "B"
                await event_repo.update_refined(
                    id=row["id"],
                    frame=frame,
                    ai_contribution=ai_contribution,
                    decision_summary=result.get("decision_summary", ""),
                    decision_type=result.get("decision_type", "other"),
                    what_was_built=result.get("what_was_built", ""),
                    problem_solved=result.get("problem_solved", ""),
                    ai_role=result.get("ai_role", ""),
                    tradeoffs=result.get("tradeoffs") or None,
                )
                ok += 1
            if (i + 1) % 10 == 0:
                print(f"[Backfill] {i + 1}/{len(rows)} done ({ok} refined)", flush=True)
            await asyncio.sleep(0.5)
        print(f"[Backfill] complete — {ok}/{len(rows)} refined", flush=True)
    except Exception as e:
        print(f"[Backfill] error: {e}", flush=True)


async def _backfill_embeddings(event_repo) -> None:
    """embedding IS NULL이고 정제 완료된 이벤트 → 다국어 임베딩 생성."""
    import asyncio
    from infrastructure.embedding.embedding_service import EmbeddingService

    try:
        rows = await event_repo._pool.fetch(
            """
            SELECT id, what_was_built, problem_solved, ai_role
            FROM decision_events
            WHERE embedding IS NULL
              AND what_was_built IS NOT NULL
              AND what_was_built != ''
            ORDER BY created_at DESC
            """
        )
        if not rows:
            return
        logger.info("Embedding backfill: %d events", len(rows))
        for row in rows:
            try:
                vec = await EmbeddingService.embed_refined(
                    row["what_was_built"] or "",
                    row["problem_solved"] or "",
                    row["ai_role"] or "",
                )
                await event_repo.update_embedding(row["id"], vec)
                await asyncio.sleep(0.05)
            except Exception as e:
                logger.warning("Embedding backfill error for %s: %s", row["id"], e)
        logger.info("Embedding backfill complete")
    except Exception as e:
        logger.warning("Embedding backfill failed: %s", e)
