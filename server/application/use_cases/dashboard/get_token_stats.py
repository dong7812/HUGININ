from dataclasses import dataclass, field
from uuid import UUID


@dataclass
class TokenDay:
    date: str
    prompt_tokens: int
    response_tokens: int
    total_tokens: int


@dataclass
class TokenStatsInput:
    workspace_id: UUID
    user_id: UUID
    days: int = 30
    branch: str | None = None


@dataclass
class TokenStatsOutput:
    daily: list[TokenDay] = field(default_factory=list)
    total_prompt: int = 0
    total_response: int = 0


class GetTokenStatsUseCase:
    def __init__(self, event_repo) -> None:
        self._events = event_repo

    async def execute(self, input: TokenStatsInput) -> TokenStatsOutput:
        rows = await self._events.get_token_stats(
            workspace_id=input.workspace_id,
            days=input.days,
            branch=input.branch,
        )
        total_prompt = sum(r.prompt_tokens for r in rows)
        total_response = sum(r.response_tokens for r in rows)
        return TokenStatsOutput(daily=rows, total_prompt=total_prompt, total_response=total_response)
