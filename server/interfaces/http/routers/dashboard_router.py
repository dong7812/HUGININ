from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from application.use_cases.dashboard.get_feed import FeedInput
from application.use_cases.dashboard.get_overview import OverviewInput
from application.use_cases.dashboard.get_token_stats import TokenStatsInput
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


@router.get("/{workspace_id}/search", response_model=FeedResponse)
async def search_events(
    workspace_id: UUID,
    request: Request,
    q: str,
    limit: int = 20,
    user_id: UUID = Depends(get_current_user_id),
):
    items = await request.app.state.event_repo.search_events(
        workspace_id=workspace_id, query=q, limit=limit
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
