"""AI 브리핑 — 워크스페이스 결정 데이터를 PM 관점으로 분석.

tool_use로 구조화된 출력을 강제 — JSON 파싱 오류 원천 차단.
"""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

_SYSTEM = """\
You are a senior PM and tech lead analyzing an AI-assisted software project.
Give direct, evidence-based opinions. Never give generic advice.
Always quote specific decisions from the data as evidence.
Flag tradeoffs that mention "나중에", "임시", "재검토".
Write all output in Korean.
"""

_TOOL = {
    "name": "submit_brief",
    "description": "Submit the PM briefing analysis result",
    "input_schema": {
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "현재 프로젝트 상태에 대한 솔직한 한 문장 진단"
            },
            "patterns": {
                "type": "array",
                "description": "발견된 패턴 2-4개",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "detail": {"type": "string", "description": "실제 결정 내용을 인용한 구체적 근거"},
                        "severity": {"type": "string", "enum": ["info", "warning", "critical"]}
                    },
                    "required": ["title", "detail", "severity"]
                }
            },
            "stale_tradeoffs": {
                "type": "array",
                "description": "미해결 트레이드오프. 없으면 빈 배열",
                "items": {
                    "type": "object",
                    "properties": {
                        "decision": {"type": "string"},
                        "made_at": {"type": "string", "description": "YYYY-MM-DD"},
                        "note": {"type": "string", "description": "뭘 미뤘는지와 지금의 위험"}
                    },
                    "required": ["decision", "made_at", "note"]
                }
            },
            "blind_spots": {
                "type": "array",
                "description": "이 단계 프로젝트에 없으면 이상한 결정 유형 1-3개",
                "items": {"type": "string"}
            },
            "next_focus": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "rationale": {"type": "string", "description": "왜 지금인지. 결정 데이터 근거 포함"}
                },
                "required": ["title", "rationale"]
            }
        },
        "required": ["summary", "patterns", "stale_tradeoffs", "blind_spots", "next_focus"]
    }
}


def _date_str(val) -> str:
    if val is None:
        return "?"
    if hasattr(val, "strftime"):
        return val.strftime("%Y-%m-%d")
    return str(val)[:10]


def _format_decisions(events: list[dict]) -> str:
    lines = []
    for e in events:
        date = _date_str(e.get("created_at"))
        parts = [f"[{date}] {e.get('decision_type','?')} | Frame {e.get('frame','?')} | AI {int((e.get('ai_contribution') or 0) * 100)}%"]
        if e.get("what_was_built"):
            parts.append(f"무엇: {e['what_was_built']}")
        if e.get("problem_solved"):
            parts.append(f"왜: {e['problem_solved']}")
        if e.get("tradeoffs"):
            parts.append(f"트레이드오프: {e['tradeoffs']}")
        lines.append("\n".join(parts))
    return "\n---\n".join(lines)


async def generate_pm_brief(events: list[dict], api_key: str) -> dict | None:
    if not events:
        return None
    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=api_key)

        dates = [_date_str(e.get("created_at")) for e in events if e.get("created_at")]
        date_range = f"{min(dates)} ~ {max(dates)}" if dates else "?"
        decisions_text = _format_decisions(events)

        user_content = (
            f"워크스페이스 결정 데이터 (총 {len(events)}개 / 기간: {date_range}):\n\n"
            + decisions_text[:7000]
            + "\n\n위 데이터를 분석해서 submit_brief 툴로 결과를 제출하세요."
        )

        msg = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2500,
            system=_SYSTEM,
            tools=[_TOOL],
            tool_choice={"type": "tool", "name": "submit_brief"},
            messages=[{"role": "user", "content": user_content}],
        )

        # tool_use 블록에서 이미 파싱된 dict 추출 — JSON 오류 없음
        for block in msg.content:
            if block.type == "tool_use" and block.name == "submit_brief":
                result = block.input
                if "next_focus" not in result:
                    result["next_focus"] = {"title": "", "rationale": ""}
                return result

        logger.warning("pm_briefer: no tool_use block in response")
        return None
    except Exception as exc:
        logger.warning("pm_briefer failed: %s", exc)
        return None
