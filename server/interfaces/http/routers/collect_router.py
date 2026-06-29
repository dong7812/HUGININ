from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from application.exceptions import DuplicateEventError, NotFoundError, PermissionDeniedError
from application.use_cases.collect.collect_event import CollectEventInput
from interfaces.http.middleware.rbac_middleware import get_current_user_id
from interfaces.http.schemas.event_schema import CollectEventRequest, CollectEventResponse
from domain.repositories.user_repository import UserRepository

router = APIRouter(prefix="/collect", tags=["collect"])


class RerefinRequest(BaseModel):
    workspace_id: UUID
    commit_hash: str
    raw_prompt: str
    raw_response: str
    diff: str | None = None


@router.post("/event", response_model=CollectEventResponse, status_code=status.HTTP_202_ACCEPTED)
async def collect_event(
    body: CollectEventRequest,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    """
    MCP 툴 및 CLI/Git Hook에서 호출하는 수집 엔드포인트.
    fastapi-mcp가 이 엔드포인트를 MCP tool로 자동 노출한다.
    """
    user_repo: UserRepository = request.app.state.user_repo
    user = await user_repo.find_by_id(user_id)
    user_name = user.name if user else ""

    try:
        result = await request.app.state.collect_event_uc.execute(
            CollectEventInput(
                workspace_id=body.workspace_id,
                user_id=user_id,
                user_name=user_name,
                raw_prompt=body.raw_prompt,
                raw_response=body.raw_response,
                project_id=body.project_id,
                commit_hash=body.commit_hash,
                diff=body.diff,
                branch=body.branch,
                prompt_tokens=body.prompt_tokens,
                response_tokens=body.response_tokens,
                committed_at=body.committed_at,
                ai_tool=body.ai_tool,
            )
        )
    except DuplicateEventError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event already collected")
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    return CollectEventResponse(event_id=result.event_id, status=result.status)


@router.post("/event/rerefine", status_code=status.HTTP_202_ACCEPTED)
async def rerefine_event(
    body: RerefinRequest,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    """기존 이벤트의 raw 데이터를 교체하고 refinement 재실행."""
    event_repo = request.app.state.event_repo
    collect_uc = request.app.state.collect_event_uc

    event = await event_repo.find_by_commit_hash(body.commit_hash, body.workspace_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    pii = collect_uc._pii_port
    masked_prompt = pii.mask(body.raw_prompt)
    masked_response = pii.mask(body.raw_response)
    masked_diff = pii.mask(body.diff) if body.diff else None

    await event_repo.update_raw_and_reset(event.id, masked_prompt, masked_response, masked_diff)

    user_repo: UserRepository = request.app.state.user_repo
    user = await user_repo.find_by_id(user_id)
    user_name = user.name if user else ""

    import asyncio
    if collect_uc._anthropic_api_key:
        asyncio.create_task(
            collect_uc._refine_async(event.id, masked_prompt, masked_response, masked_diff, user_name)
        )

    return {"event_id": str(event.id), "status": "pending"}
