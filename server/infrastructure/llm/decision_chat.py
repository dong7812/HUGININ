"""결정 DB를 context로 하는 RAG 챗."""
from __future__ import annotations
import logging

logger = logging.getLogger(__name__)

_SYSTEM = """\
You are HUGININ, an AI assistant that helps developers understand their own codebase decisions.
You have access to the user's past AI-assisted development decisions — the actual Claude conversations,
diffs, and context behind every commit.

Rules:
- Answer in Korean
- Ground every answer in the provided decision history
- If a relevant decision exists, quote it: "2024-03-15 커밋에서 JWT를 선택한 이유는..."
- If no relevant decision exists, say so clearly: "관련 결정 기록이 없어요"
- Be direct and specific — not generic advice
- If a past tradeoff was deferred, flag it: "당시 X를 미뤘는데, 지금 문제가 된 것 같아요"
"""


def _fmt(decisions: list[dict]) -> str:
    parts = []
    for d in decisions:
        date = d.get("created_at", "")
        if hasattr(date, "strftime"):
            date = date.strftime("%Y-%m-%d")
        lines = [f"[{date}] {d.get('decision_type','?')} | Frame {d.get('frame','?')}"]
        if d.get("what_was_built"):
            lines.append(f"무엇: {d['what_was_built']}")
        if d.get("problem_solved"):
            lines.append(f"왜: {d['problem_solved']}")
        if d.get("ai_role"):
            lines.append(f"역할: {d['ai_role']}")
        if d.get("tradeoffs"):
            lines.append(f"트레이드오프: {d['tradeoffs']}")
        parts.append("\n".join(lines))
    return "\n---\n".join(parts) if parts else "관련 결정 기록 없음"


async def chat_with_decisions(
    message: str,
    decisions: list[dict],
    api_key: str,
    history: list[dict] | None = None,
) -> str:
    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=api_key)

        context = _fmt(decisions)
        user_content = f"[관련 결정 기록]\n{context}\n\n[질문]\n{message}"

        messages = list(history or [])
        messages.append({"role": "user", "content": user_content})

        resp = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            system=_SYSTEM,
            messages=messages,
        )
        return resp.content[0].text
    except Exception as e:
        logger.warning("decision_chat failed: %s", e)
        return "죄송해요, 잠시 오류가 발생했어요. 다시 시도해 주세요."
