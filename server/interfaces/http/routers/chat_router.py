"""워크스페이스 결정 DB 기반 RAG 챗."""
from __future__ import annotations
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from interfaces.http.middleware.rbac_middleware import get_current_user_id

router = APIRouter(prefix="/dashboard", tags=["chat"])


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class SourceItem(BaseModel):
    id: str
    what_was_built: str | None
    created_at: str
    frame: str | None


class ChatResponse(BaseModel):
    reply: str
    sources: list[SourceItem]


@router.post("/{workspace_id}/chat", response_model=ChatResponse)
async def chat(
    workspace_id: UUID,
    body: ChatRequest,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    api_key = request.app.state.anthropic_api_key
    if not api_key:
        raise HTTPException(status_code=503, detail="AI not configured")

    from infrastructure.embedding.embedding_service import EmbeddingService
    from infrastructure.llm.decision_chat import chat_with_decisions

    # 질문을 임베딩해서 관련 결정 검색
    embedding = await EmbeddingService.embed(body.message)
    items = await request.app.state.event_repo.recall_across_workspaces(
        user_id=user_id,
        embedding=embedding,
        limit=6,
    )

    decisions = [
        {
            "created_at": item.created_at,
            "decision_type": item.decision_type,
            "frame": item.frame,
            "what_was_built": item.what_was_built,
            "problem_solved": item.problem_solved,
            "ai_role": item.ai_role,
            "tradeoffs": item.tradeoffs,
        }
        for item in items
    ]

    history = [{"role": m.role, "content": m.content} for m in body.history[-6:]]

    reply = await chat_with_decisions(body.message, decisions, api_key, history=history)

    sources = [
        SourceItem(
            id=str(item.event_id),
            what_was_built=item.what_was_built,
            created_at=item.created_at.strftime("%Y-%m-%d") if item.created_at else "",
            frame=item.frame,
        )
        for item in items[:3]
        if item.what_was_built
    ]

    return ChatResponse(reply=reply, sources=sources)
