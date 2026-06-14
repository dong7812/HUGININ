"""
HUGININ Memory — 팀 AI 의사결정 이력 조회.

이 라우터의 엔드포인트는 MCP tool로 노출되어 Claude가 자율적으로 호출한다.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from interfaces.http.middleware.rbac_middleware import get_current_user_id

router = APIRouter(prefix="/memory", tags=["memory"])


@router.get(
    "/recall",
    summary="Recall past AI decisions from team memory",
    description="""
Search the team's historical AI decisions using semantic similarity.

**WHEN TO USE THIS TOOL:**
- At the start of any non-trivial implementation task
- When you're about to make an architectural choice
- When debugging a class of bug you haven't seen before
- When the user asks "have we done this before?" or "what did we decide about X?"
- Before suggesting an approach, check if the team already tried and rejected it

**HOW TO USE:**
Describe what you're about to implement or the problem you're solving in natural language.
The tool returns the most relevant past decisions with full context:
- The original prompt and AI response
- The code diff that resulted
- The branch and commit where it happened
- Who made the decision and when
- Team comments and discussion

**EXAMPLE QUERIES:**
- "JWT authentication token refresh strategy"
- "database connection pooling asyncpg"
- "React state management architecture decision"
- "error handling pattern for external API calls"
""",
)
async def recall_decisions(
    request: Request,
    q: str = Query(..., description="Natural language description of the problem or decision you're researching"),
    limit: int = Query(5, ge=1, le=10, description="Number of past decisions to return"),
    user_id: UUID = Depends(get_current_user_id),
):
    from infrastructure.embedding.embedding_service import EmbeddingService

    embedding = await EmbeddingService.embed(q)
    items = await request.app.state.event_repo.recall_across_workspaces(
        user_id=user_id,
        embedding=embedding,
        limit=limit,
    )

    if not items:
        return {
            "query": q,
            "found": 0,
            "message": "No relevant past decisions found. This appears to be a new problem for the team.",
            "results": [],
        }

    return {
        "query": q,
        "found": len(items),
        "message": f"Found {len(items)} relevant past decision(s). Review before proceeding.",
        "results": [
            {
                "event_id": str(item.event_id),
                "when": item.created_at.isoformat(),
                "who": item.user_email,
                "project": item.project_name,
                "branch": item.branch,
                "prompt_summary": item.prompt_preview,
                "ai_response_preview": (item.raw_response or "")[:400],
                "had_diff": item.diff is not None,
                "commit": item.commit_hash,
                "status": item.status,
                "team_comments": item.comment_count,
            }
            for item in items
        ],
    }
