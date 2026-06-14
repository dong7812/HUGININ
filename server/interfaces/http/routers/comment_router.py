from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from application.exceptions import NotFoundError, PermissionDeniedError
from application.use_cases.comment.add_comment import AddCommentInput
from application.use_cases.comment.list_comments import CommentItem
from interfaces.http.middleware.rbac_middleware import get_current_user_id

router = APIRouter(prefix="/decision", tags=["comments"])


class AddCommentRequest(BaseModel):
    workspace_id: UUID
    content: str


class CommentResponse(BaseModel):
    comment_id: str
    user_email: str
    content: str
    created_at: str


@router.post("/{event_id}/comment", status_code=status.HTTP_201_CREATED)
async def add_comment(
    event_id: UUID,
    body: AddCommentRequest,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    try:
        result = await request.app.state.add_comment_uc.execute(
            AddCommentInput(
                event_id=event_id,
                user_id=user_id,
                workspace_id=body.workspace_id,
                content=body.content,
            )
        )
    except (NotFoundError, PermissionDeniedError) as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    return {"comment_id": result.comment_id, "created_at": result.created_at}


@router.get("/{event_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    event_id: UUID,
    workspace_id: UUID,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    from application.use_cases.comment.list_comments import ListCommentsInput
    try:
        result = await request.app.state.list_comments_uc.execute(
            ListCommentsInput(
                event_id=event_id,
                workspace_id=workspace_id,
                user_id=user_id,
            )
        )
    except (NotFoundError, PermissionDeniedError) as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    return [
        CommentResponse(
            comment_id=item.comment_id,
            user_email=item.user_email,
            content=item.content,
            created_at=item.created_at,
        )
        for item in result.items
    ]
