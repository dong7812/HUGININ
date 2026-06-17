from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from interfaces.http.middleware.rbac_middleware import get_current_user_id

router = APIRouter(prefix="/dashboard", tags=["pm-brief"])


class PmPattern(BaseModel):
    title: str
    detail: str
    severity: str  # info | warning | critical


class StaleTradeoff(BaseModel):
    decision: str
    made_at: str
    note: str


class NextFocus(BaseModel):
    title: str
    rationale: str


class PmBriefResponse(BaseModel):
    summary: str
    patterns: list[PmPattern]
    stale_tradeoffs: list[StaleTradeoff]
    blind_spots: list[str]
    next_focus: NextFocus
    event_count: int


@router.post("/{workspace_id}/pm-brief", response_model=PmBriefResponse)
async def generate_pm_brief(
    workspace_id: UUID,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    api_key = request.app.state.anthropic_api_key
    if not api_key:
        raise HTTPException(503, "AI analysis unavailable")

    rows = await request.app.state.event_repo._pool.fetch(
        """
        SELECT
            e.created_at, e.decision_type, e.frame, e.ai_contribution,
            e.what_was_built, e.problem_solved, e.tradeoffs
        FROM decision_events e
        JOIN workspace_members wm ON wm.workspace_id = e.workspace_id AND wm.user_id = $2
        WHERE e.workspace_id = $1
          AND e.status = 'refined'
          AND e.what_was_built IS NOT NULL
        ORDER BY e.created_at DESC
        LIMIT 60
        """,
        workspace_id, user_id,
    )

    if not rows:
        raise HTTPException(422, "분석할 결정 데이터가 없습니다. 결정이 정제된 후 시도해주세요.")

    events = [dict(r) for r in rows]

    from infrastructure.llm.pm_briefer import generate_pm_brief as _brief
    result = await _brief(events, api_key)
    if not result:
        raise HTTPException(500, "분석 생성 실패")

    return PmBriefResponse(
        summary=result.get("summary", ""),
        patterns=[PmPattern(**p) for p in result.get("patterns", [])],
        stale_tradeoffs=[StaleTradeoff(**t) for t in result.get("stale_tradeoffs", [])],
        blind_spots=result.get("blind_spots", []),
        next_focus=NextFocus(**result["next_focus"]) if result.get("next_focus") else NextFocus(title="", rationale=""),
        event_count=len(events),
    )
