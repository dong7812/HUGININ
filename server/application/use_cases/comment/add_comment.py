from dataclasses import dataclass
from uuid import UUID

from application.exceptions import NotFoundError, PermissionDeniedError
from domain.entities.comment import DecisionComment


@dataclass
class AddCommentInput:
    event_id: UUID
    user_id: UUID
    workspace_id: UUID
    content: str


@dataclass
class AddCommentOutput:
    comment_id: str
    created_at: str


class AddCommentUseCase:
    def __init__(self, comment_repo, event_repo, workspace_repo) -> None:
        self._comments = comment_repo
        self._events = event_repo
        self._workspaces = workspace_repo

    async def execute(self, input: AddCommentInput) -> AddCommentOutput:
        member = await self._workspaces.get_member(input.workspace_id, input.user_id)
        if not member:
            raise PermissionDeniedError("Not a workspace member")

        event = await self._events.find_by_id(input.event_id)
        if not event or event.workspace_id != input.workspace_id:
            raise NotFoundError("Event not found")

        if not input.content.strip():
            raise ValueError("Comment content cannot be empty")

        comment = DecisionComment.create(
            event_id=input.event_id,
            user_id=input.user_id,
            content=input.content.strip(),
        )
        await self._comments.save(comment)
        return AddCommentOutput(
            comment_id=str(comment.id),
            created_at=comment.created_at.isoformat(),
        )
