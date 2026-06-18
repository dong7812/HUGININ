"""GitHub Webhook 수신 라우터 — PR 이벤트를 DecisionEvent로 저장."""
import asyncio
import hashlib
import hmac
import logging
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Header, HTTPException, Request, status

from domain.entities.event import DecisionEvent, EventStatus

logger = logging.getLogger("huginin.webhook")

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _verify_signature(body: bytes, secret: str, sig_header: str | None) -> bool:
    if not secret:
        return True  # secret 미설정 시 검증 생략 (개발 환경)
    if not sig_header or not sig_header.startswith("sha256="):
        return False
    expected = "sha256=" + hmac.new(
        secret.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, sig_header)


@router.post("/github/{workspace_id}", status_code=status.HTTP_202_ACCEPTED)
async def github_webhook(
    workspace_id: UUID,
    request: Request,
    x_hub_signature_256: str | None = Header(default=None),
    x_github_event: str | None = Header(default=None),
):
    body = await request.body()

    secret = getattr(request.app.state, "github_webhook_secret", "")
    if not _verify_signature(body, secret, x_hub_signature_256):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid signature")

    if x_github_event != "pull_request":
        return {"accepted": False, "reason": "ignored event type"}

    import json
    payload = json.loads(body)
    action = payload.get("action", "")

    if action not in ("opened", "closed", "reopened"):
        return {"accepted": False, "reason": f"ignored action: {action}"}

    pr = payload["pull_request"]
    merged = pr.get("merged", False)

    if action == "closed" and not merged:
        event_type = "pr_closed"
    elif action == "closed" and merged:
        event_type = "pr_merged"
    else:
        event_type = "pr_opened"

    pr_number = pr["number"]
    pr_title = pr.get("title", "")
    pr_body = pr.get("body") or ""
    pr_url = pr.get("html_url", "")
    github_author = pr.get("user", {}).get("login", "")
    branch = pr.get("head", {}).get("ref", "")

    # 멱등성 키: pr#<number> 로 중복 방지
    commit_hash = f"pr#{pr_number}"

    workspace_repo = request.app.state.workspace_repo
    workspace = await workspace_repo.find_by_id(workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")

    event_repo = request.app.state.event_repo

    # 이미 동일 PR 이벤트가 있으면 skip
    existing = await event_repo.find_by_commit_hash(commit_hash)
    if existing and existing.workspace_id == workspace_id:
        return {"accepted": False, "reason": "duplicate"}

    raw_prompt = f"#{pr_number}: {pr_title}\n\n{pr_body}".strip()

    event = DecisionEvent(
        id=uuid4(),
        workspace_id=workspace_id,
        project_id=None,
        user_id=workspace.owner_id,
        commit_hash=commit_hash,
        raw_prompt=raw_prompt,
        raw_response="",
        diff=None,
        status=EventStatus.PENDING,
        created_at=datetime.now(timezone.utc),
        branch=branch,
        prompt_tokens=max(1, len(raw_prompt) // 4),
        response_tokens=0,
        event_type=event_type,
        pr_number=pr_number,
        pr_url=pr_url,
        github_author=github_author,
    )
    await event_repo.save(event)

    api_key = getattr(request.app.state, "anthropic_api_key", "")
    owner_name = github_author or "개발자"
    asyncio.create_task(_refine_pr_async(event_repo, event.id, raw_prompt, api_key, owner_name))

    logger.info("PR event stored: %s %s #%d", event_type, workspace_id, pr_number)
    return {"accepted": True, "event_id": str(event.id), "event_type": event_type}


async def _refine_pr_async(event_repo, event_id: UUID, raw_prompt: str, api_key: str, author: str) -> None:
    if not api_key:
        return
    try:
        from infrastructure.llm.claude_refiner import refine_event
        result = await refine_event(raw_prompt, "", None, api_key, author)
        if result:
            await event_repo.update_refined(
                id=event_id,
                frame=result.get("frame", "B"),
                ai_contribution=float(result.get("ai_contribution", 0.3)),
                decision_summary=result.get("decision_summary", ""),
                decision_type=result.get("decision_type", "feature"),
                what_was_built=result.get("what_was_built", ""),
                problem_solved=result.get("problem_solved", ""),
                ai_role=result.get("ai_role", ""),
            )
    except Exception as e:
        logger.warning("PR refine failed: %s", e)
