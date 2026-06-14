from dataclasses import dataclass, field
from uuid import UUID


@dataclass
class CommentItem:
    comment_id: str
    user_email: str
    content: str
    created_at: str


@dataclass
class ListCommentsInput:
    event_id: UUID
    workspace_id: UUID
    user_id: UUID


@dataclass
class ListCommentsOutput:
    items: list[CommentItem] = field(default_factory=list)


class ListCommentsUseCase:
    def __init__(self, comment_repo, event_repo, workspace_repo) -> None:
        self._comments = comment_repo
        self._events = event_repo
        self._workspaces = workspace_repo

    async def execute(self, input: ListCommentsInput) -> ListCommentsOutput:
        from application.exceptions import NotFoundError, PermissionDeniedError
        member = await self._workspaces.get_member(input.workspace_id, input.user_id)
        if not member:
            raise PermissionDeniedError("Not a workspace member")

        event = await self._events.find_by_id(input.event_id)
        if not event or event.workspace_id != input.workspace_id:
            raise NotFoundError("Event not found")

        items = await self._comments.list_by_event(input.event_id)
        return ListCommentsOutput(items=items)
