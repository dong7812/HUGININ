from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from application.use_cases.dashboard.get_feed import FeedInput
from application.use_cases.dashboard.get_overview import OverviewInput
from application.use_cases.dashboard.get_token_stats import TokenStatsInput
from application.use_cases.dashboard.get_frame_stats import FrameStatsInput
from application.use_cases.dashboard.get_ai_trend import AiTrendInput
from application.use_cases.dashboard.get_cache_suggestions import CacheSuggestionsInput
from interfaces.http.middleware.rbac_middleware import get_current_user_id

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class OverviewResponse(BaseModel):
    member_count: int
    project_count: int
    events_today: int
    events_week: int
    events_total: int


class FeedItemResponse(BaseModel):
    event_id: UUID
    user_email: str
    user_name: str = ""
    project_name: str | None = None
    prompt_preview: str
    status: str
    created_at: str
    branch: str | None = None
    prompt_tokens: int | None = None
    response_tokens: int | None = None
    raw_response: str | None = None
    diff: str | None = None
    commit_hash: str | None = None
    comment_count: int = 0
    # ETL 분석 결과
    frame: str | None = None
    ai_contribution: float | None = None
    decision_summary: str | None = None
    decision_type: str | None = None
    what_was_built: str | None = None
    problem_solved: str | None = None
    ai_role: str | None = None
    # GitHub PR 이벤트
    event_type: str = "commit"
    pr_number: int | None = None
    pr_url: str | None = None
    github_author: str | None = None


class FeedResponse(BaseModel):
    items: list[FeedItemResponse]
    total: int


class MemberFrameStatsResponse(BaseModel):
    user_name: str
    user_email: str
    A: int = 0
    B: int = 0
    C: int = 0
    D: int = 0
    avg_ai: float = 0.0
    total: int = 0


class FrameStatsResponse(BaseModel):
    distribution: dict[str, int]
    total: int
    avg_ai_contribution: float
    by_member: list[MemberFrameStatsResponse]


class TokenDayResponse(BaseModel):
    date: str
    prompt_tokens: int
    response_tokens: int
    total_tokens: int


class TokenStatsResponse(BaseModel):
    daily: list[TokenDayResponse]
    total_prompt: int
    total_response: int


@router.get("/{workspace_id}/overview", response_model=OverviewResponse)
async def get_overview(
    workspace_id: UUID,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    result = await request.app.state.get_overview_uc.execute(
        OverviewInput(workspace_id=workspace_id, user_id=user_id)
    )
    return OverviewResponse(
        member_count=result.member_count,
        project_count=result.project_count,
        events_today=result.events_today,
        events_week=result.events_week,
        events_total=result.events_total,
    )


@router.get("/{workspace_id}/feed", response_model=FeedResponse)
async def get_feed(
    workspace_id: UUID,
    request: Request,
    limit: int = 15,
    offset: int = 0,
    branch: str | None = None,
    date_from: datetime | None = None,
    user_id: UUID = Depends(get_current_user_id),
):
    result = await request.app.state.get_feed_uc.execute(
        FeedInput(
            workspace_id=workspace_id,
            user_id=user_id,
            limit=limit,
            offset=offset,
            branch=branch,
            date_from=date_from,
        )
    )
    return FeedResponse(
        items=[
            FeedItemResponse(
                event_id=item.event_id,
                user_email=item.user_email,
                user_name=item.user_name,
                project_name=item.project_name,
                prompt_preview=item.prompt_preview,
                status=item.status,
                created_at=item.created_at.isoformat(),
                branch=item.branch,
                prompt_tokens=item.prompt_tokens,
                response_tokens=item.response_tokens,
                raw_response=item.raw_response,
                diff=item.diff,
                commit_hash=item.commit_hash,
                comment_count=item.comment_count,
                frame=item.frame,
                ai_contribution=item.ai_contribution,
                decision_summary=item.decision_summary,
                decision_type=item.decision_type,
                what_was_built=item.what_was_built,
                problem_solved=item.problem_solved,
                ai_role=item.ai_role,
                event_type=item.event_type,
                pr_number=item.pr_number,
                pr_url=item.pr_url,
                github_author=item.github_author,
            )
            for item in result.items
        ],
        total=result.total,
    )


@router.get("/{workspace_id}/branches")
async def list_branches(
    workspace_id: UUID,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    branches = await request.app.state.event_repo.list_branches(workspace_id)
    return {"branches": branches}


@router.get("/{workspace_id}/token-stats", response_model=TokenStatsResponse)
async def get_token_stats(
    workspace_id: UUID,
    request: Request,
    days: int = 30,
    branch: str | None = None,
    user_id: UUID = Depends(get_current_user_id),
):
    result = await request.app.state.get_token_stats_uc.execute(
        TokenStatsInput(workspace_id=workspace_id, user_id=user_id, days=days, branch=branch)
    )
    return TokenStatsResponse(
        daily=[
            TokenDayResponse(
                date=d.date,
                prompt_tokens=d.prompt_tokens,
                response_tokens=d.response_tokens,
                total_tokens=d.total_tokens,
            )
            for d in result.daily
        ],
        total_prompt=result.total_prompt,
        total_response=result.total_response,
    )


@router.get("/{workspace_id}/frame-stats", response_model=FrameStatsResponse)
async def get_frame_stats(
    workspace_id: UUID,
    request: Request,
    days: int = 30,
    user_id: UUID = Depends(get_current_user_id),
):
    result = await request.app.state.get_frame_stats_uc.execute(
        FrameStatsInput(workspace_id=workspace_id, user_id=user_id, days=days)
    )
    return FrameStatsResponse(
        distribution=result.distribution,
        total=result.total,
        avg_ai_contribution=result.avg_ai_contribution,
        by_member=[
            MemberFrameStatsResponse(
                user_name=m.user_name,
                user_email=m.user_email,
                A=m.A,
                B=m.B,
                C=m.C,
                D=m.D,
                avg_ai=m.avg_ai,
                total=m.total,
            )
            for m in result.by_member
        ],
    )


class AiTrendBucketResponse(BaseModel):
    bucket: str
    avg_ai: float
    total: int
    frame_a: int
    frame_b: int
    frame_c: int
    frame_d: int


class AiTrendResponse(BaseModel):
    period: str
    buckets: list[AiTrendBucketResponse]
    current_avg_ai: float
    prev_avg_ai: float
    delta_pct: float


class CacheSuggestionResponse(BaseModel):
    domain: str
    count: int
    priority: str
    action: str
    example: str
    suggestion_type: str


class CacheSuggestionsResponse(BaseModel):
    suggestions: list[CacheSuggestionResponse]
    total_events_analyzed: int
    avg_prompt_tokens: float
    high_token_alert: bool


@router.get("/{workspace_id}/ai-trend", response_model=AiTrendResponse)
async def get_ai_trend(
    workspace_id: UUID,
    request: Request,
    period: str = "7d",
    user_id: UUID = Depends(get_current_user_id),
):
    result = await request.app.state.get_ai_trend_uc.execute(
        AiTrendInput(workspace_id=workspace_id, user_id=user_id, period=period)
    )
    return AiTrendResponse(
        period=result.period,
        buckets=[
            AiTrendBucketResponse(
                bucket=b.bucket,
                avg_ai=b.avg_ai,
                total=b.total,
                frame_a=b.frame_a,
                frame_b=b.frame_b,
                frame_c=b.frame_c,
                frame_d=b.frame_d,
            )
            for b in result.buckets
        ],
        current_avg_ai=result.current_avg_ai,
        prev_avg_ai=result.prev_avg_ai,
        delta_pct=result.delta_pct,
    )


@router.get("/{workspace_id}/cache-suggestions", response_model=CacheSuggestionsResponse)
async def get_cache_suggestions(
    workspace_id: UUID,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    result = await request.app.state.get_cache_suggestions_uc.execute(
        CacheSuggestionsInput(workspace_id=workspace_id, user_id=user_id)
    )
    return CacheSuggestionsResponse(
        suggestions=[
            CacheSuggestionResponse(
                domain=s.domain,
                count=s.count,
                priority=s.priority,
                action=s.action,
                example=s.example,
                suggestion_type=s.suggestion_type,
            )
            for s in result.suggestions
        ],
        total_events_analyzed=result.total_events_analyzed,
        avg_prompt_tokens=result.avg_prompt_tokens,
        high_token_alert=result.high_token_alert,
    )


@router.get("/{workspace_id}/search", response_model=FeedResponse)
async def search_events(
    workspace_id: UUID,
    request: Request,
    q: str,
    limit: int = 20,
    user_id: UUID = Depends(get_current_user_id),
):
    from infrastructure.embedding.embedding_service import EmbeddingService
    try:
        embedding = await EmbeddingService.embed(q)
    except Exception:
        embedding = None
    items = await request.app.state.event_repo.search_events(
        workspace_id=workspace_id, query=q, limit=limit, embedding=embedding
    )
    return FeedResponse(
        items=[
            FeedItemResponse(
                event_id=item.event_id,
                user_email=item.user_email,
                user_name=item.user_name,
                project_name=item.project_name,
                prompt_preview=item.prompt_preview,
                status=item.status,
                created_at=item.created_at.isoformat(),
                branch=item.branch,
                prompt_tokens=item.prompt_tokens,
                response_tokens=item.response_tokens,
                raw_response=item.raw_response,
                diff=item.diff,
                commit_hash=item.commit_hash,
                comment_count=item.comment_count,
                frame=item.frame,
                ai_contribution=item.ai_contribution,
                decision_summary=item.decision_summary,
                decision_type=item.decision_type,
                what_was_built=item.what_was_built,
                problem_solved=item.problem_solved,
                ai_role=item.ai_role,
                event_type=item.event_type,
                pr_number=item.pr_number,
                pr_url=item.pr_url,
                github_author=item.github_author,
            )
            for item in items
        ],
        total=len(items),
    )
