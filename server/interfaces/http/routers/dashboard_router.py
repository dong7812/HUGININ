from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from fastapi.responses import PlainTextResponse
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
    tradeoffs: str | None = None
    rejected_alternatives: str | None = None
    implicit_constraints: str | None = None
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
    frame: str | None = None,
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
            frame=frame,
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
                tradeoffs=item.tradeoffs,
                rejected_alternatives=item.rejected_alternatives,
                implicit_constraints=item.implicit_constraints,
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


@router.get("/{workspace_id}/commit-hashes")
async def list_commit_hashes(
    workspace_id: UUID,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    hashes = await request.app.state.event_repo.list_commit_hashes(workspace_id)
    return {"hashes": hashes}


class FixTimestampsRequest(BaseModel):
    timestamps: dict[str, datetime]


@router.patch("/{workspace_id}/fix-commit-timestamps")
async def fix_commit_timestamps(
    workspace_id: UUID,
    body: FixTimestampsRequest,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    aware = {
        h: ts.replace(tzinfo=timezone.utc) if ts.tzinfo is None else ts
        for h, ts in body.timestamps.items()
    }
    updated = await request.app.state.event_repo.fix_commit_timestamps(workspace_id, aware)
    return {"updated": updated}


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


class SuggestItem(BaseModel):
    text: str
    decision_type: str | None = None


class SuggestResponse(BaseModel):
    items: list[SuggestItem]


@router.get("/{workspace_id}/suggest", response_model=SuggestResponse)
async def suggest_events(
    workspace_id: UUID,
    request: Request,
    q: str,
    limit: int = 6,
    user_id: UUID = Depends(get_current_user_id),
):
    items = await request.app.state.event_repo.suggest_events(
        workspace_id=workspace_id, query=q, limit=limit
    )
    return SuggestResponse(items=[SuggestItem(**i) for i in items])


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
                tradeoffs=item.tradeoffs,
                rejected_alternatives=item.rejected_alternatives,
                implicit_constraints=item.implicit_constraints,
                event_type=item.event_type,
                pr_number=item.pr_number,
                pr_url=item.pr_url,
                github_author=item.github_author,
            )
            for item in items
        ],
        total=len(items),
    )


class SmartSearchEvent(BaseModel):
    event_id: str
    created_at: str
    what_was_built: str | None = None
    problem_solved: str | None = None
    decision_type: str | None = None
    frame: str | None = None
    ai_contribution: float | None = None
    project_name: str | None = None
    branch: str | None = None
    commit_hash: str | None = None


class SmartSearchResponse(BaseModel):
    query: str
    synthesis: str          # LLM이 생성한 흐름 분석
    found: int
    events: list[SmartSearchEvent]


@router.get("/{workspace_id}/smart-search", response_model=SmartSearchResponse)
async def smart_search(
    workspace_id: UUID,
    request: Request,
    q: str,
    limit: int = 8,
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

    if not items:
        return SmartSearchResponse(
            query=q, synthesis="관련된 결정 기록을 찾지 못했습니다.", found=0, events=[]
        )

    api_key = getattr(request.app.state, "anthropic_api_key", None)
    synthesis = await _synthesize_search(q, items, api_key)

    return SmartSearchResponse(
        query=q,
        synthesis=synthesis,
        found=len(items),
        events=[
            SmartSearchEvent(
                event_id=str(item.event_id),
                created_at=item.created_at.isoformat(),
                what_was_built=item.what_was_built,
                problem_solved=item.problem_solved,
                decision_type=item.decision_type,
                frame=item.frame,
                ai_contribution=item.ai_contribution,
                project_name=item.project_name,
                branch=item.branch,
                commit_hash=item.commit_hash,
            )
            for item in items
        ],
    )


async def _synthesize_search(query: str, items, api_key: str | None) -> str:
    if not api_key:
        return f"총 {len(items)}개의 관련 결정을 찾았습니다."
    try:
        import anthropic

        records = "\n\n".join(
            f"[{i+1}] {item.created_at.strftime('%Y-%m-%d')} · {item.decision_type or '기타'} · {item.project_name or ''}\n"
            f"- 무엇을 만들었나: {item.what_was_built or item.prompt_preview or ''}\n"
            f"- 왜 필요했나: {item.problem_solved or ''}"
            for i, item in enumerate(items)
        )

        prompt = f"""검색어: "{query}"

아래는 팀의 AI 결정 기록 {len(items)}개입니다 (시간순):

{records}

위 기록들을 바탕으로 다음을 한국어로 작성하세요 (총 5-8문장):
1. 검색어와 관련된 결정들의 흐름과 맥락 요약
2. 시간에 따라 어떻게 발전하거나 반복되었는지
3. 가장 주목할 만한 결정이나 패턴
4. 이 맥락에서 주의해야 할 점 또는 미해결 트레이드오프

마크다운 없이 plain text로 작성하세요."""

        client = anthropic.AsyncAnthropic(api_key=api_key)
        msg = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=900,
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text.strip()
    except Exception:
        return f"총 {len(items)}개의 관련 결정을 찾았습니다."


# ──────────────────────────────────────────────
# 종합 컨텍스트 추출 (Export)
# ──────────────────────────────────────────────

def _format_export_md(items: list, level: int, workspace_name: str) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    lines: list[str] = [
        f"# {workspace_name} — 의사결정 컨텍스트",
        f"Generated: {now} · Level {level} · {len(items)}개 결정",
        "",
    ]

    FRAME_LABEL = {"A": "Human-led", "B": "AI-assisted", "C": "AI-led", "D": "Automated"}
    TYPE_LABEL = {
        "feature": "기능", "bugfix": "버그픽스", "refactor": "리팩터",
        "config": "설정", "infrastructure": "인프라", "docs": "문서",
        "test": "테스트", "other": "기타",
    }

    prev_date = ""
    for item in items:
        date_str = item.created_at.strftime("%Y-%m-%d")
        if date_str != prev_date:
            lines.append(f"## {date_str}")
            lines.append("")
            prev_date = date_str

        title = item.what_was_built or item.prompt_preview or "(제목 없음)"
        meta_parts = []
        if item.decision_type:
            meta_parts.append(TYPE_LABEL.get(item.decision_type, item.decision_type))
        if item.frame:
            meta_parts.append(f"Frame {item.frame} · {FRAME_LABEL.get(item.frame, '')}")
        if item.ai_contribution is not None:
            meta_parts.append(f"AI {round(item.ai_contribution * 100)}%")
        if item.project_name:
            meta_parts.append(item.project_name)
        if item.commit_hash:
            meta_parts.append(f"`{item.commit_hash[:7]}`")
        meta = " · ".join(meta_parts)

        if level == 1:
            lines.append(f"### {title}")
            if meta:
                lines.append(f"_{meta}_")
            if item.problem_solved:
                lines.append(f"> {item.problem_solved}")
            lines.append("")

        elif level == 2:
            lines.append(f"### {title}")
            if meta:
                lines.append(f"_{meta}_")
            lines.append("")
            if item.problem_solved:
                lines.append(f"**왜**: {item.problem_solved}")
                lines.append("")
            if item.what_was_built:
                lines.append(f"**무엇**: {item.what_was_built}")
                lines.append("")
            if item.tradeoffs:
                lines.append(f"**트레이드오프**: {item.tradeoffs}")
                lines.append("")

        else:  # level 3
            lines.append(f"### {title}")
            if meta:
                lines.append(f"_{meta}_")
            lines.append("")
            if item.problem_solved:
                lines.append(f"**왜**: {item.problem_solved}")
                lines.append("")
            if item.what_was_built:
                lines.append(f"**무엇**: {item.what_was_built}")
                lines.append("")
            if item.tradeoffs:
                lines.append(f"**트레이드오프**: {item.tradeoffs}")
                lines.append("")
            if item.rejected_alternatives:
                lines.append(f"**기각된 대안**: {item.rejected_alternatives}")
                lines.append("")
            if item.implicit_constraints:
                lines.append(f"**당시 제약**: {item.implicit_constraints}")
                lines.append("")
            if item.diff:
                lines.append("<details>")
                lines.append("<summary>Diff</summary>")
                lines.append("")
                lines.append("```diff")
                lines.append(item.diff[:3000])
                lines.append("```")
                lines.append("</details>")
                lines.append("")

    return "\n".join(lines)


@router.get("/{workspace_id}/export")
async def export_context(
    workspace_id: UUID,
    request: Request,
    level: int = 2,
    user_id: UUID = Depends(get_current_user_id),
):
    level = max(1, min(3, level))

    repo = request.app.state.event_repo
    ws_row = await repo._pool.fetchrow(
        "SELECT name FROM workspaces WHERE id = $1", workspace_id
    )
    ws_name = ws_row["name"] if ws_row else str(workspace_id)[:8]

    rows = await repo._pool.fetch(
        """
        SELECT
            e.id, e.created_at,
            LEFT(e.raw_prompt, 120) AS prompt_preview,
            e.diff, e.commit_hash,
            u.name AS user_name, p.name AS project_name,
            e.branch, e.frame, e.ai_contribution,
            e.decision_type, e.what_was_built, e.problem_solved,
            e.tradeoffs, e.rejected_alternatives, e.implicit_constraints
        FROM decision_events e
        JOIN users u ON u.id = e.user_id
        LEFT JOIN projects p ON p.id = e.project_id
        WHERE e.workspace_id = $1
          AND e.status = 'refined'
        ORDER BY e.created_at ASC
        LIMIT 500
        """,
        workspace_id,
    )

    class _Item:
        pass

    items = []
    for r in rows:
        obj = _Item()
        for k in r.keys():
            setattr(obj, k, r[k])
        items.append(obj)

    md = _format_export_md(items, level, ws_name)
    filename = f"huginin-context-L{level}-{datetime.now(timezone.utc).strftime('%Y%m%d')}.md"

    return PlainTextResponse(
        content=md,
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
