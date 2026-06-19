from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status

from application.exceptions import DuplicateEventError, NotFoundError, PermissionDeniedError
from application.use_cases.collect.collect_event import CollectEventInput
from interfaces.http.middleware.rbac_middleware import get_current_user_id
from interfaces.http.schemas.event_schema import CollectEventRequest, CollectEventResponse
from domain.repositories.user_repository import UserRepository

router = APIRouter(prefix="/collect", tags=["collect"])


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
            )
        )
    except DuplicateEventError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Event already collected")
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    return CollectEventResponse(event_id=result.event_id, status=result.status)
