"""PM 브리핑 — 워크스페이스 결정 데이터를 PM 관점으로 분석."""
from __future__ import annotations

import json
import logging
import re

logger = logging.getLogger(__name__)

_SYSTEM = """\
You are a senior PM and tech lead analyzing an AI-assisted software project.
Respond ONLY with a single valid JSON object — no markdown, no explanation, no code fences.
Every string value must be properly escaped (no raw newlines inside strings).

Rules:
- Quote specific decisions from the data as evidence
- Give direct opinions: "this is a risk", "do this next"
- If tradeoffs mention "나중에", "임시", "재검토" — flag them
- Never give generic advice unrelated to the actual data
- Write all content in Korean
"""

_USER_SCHEMA = """\
Analyze the decision data above and return ONLY this JSON (no other text):
{
  "summary": "한 문장 진단. 현재 프로젝트 상태에 대한 솔직한 평가",
  "patterns": [
    {
      "title": "패턴 제목",
      "detail": "구체적 근거. 실제 결정 내용 인용 포함",
      "severity": "info"
    }
  ],
  "stale_tradeoffs": [
    {
      "decision": "결정 제목",
      "made_at": "YYYY-MM-DD",
      "note": "뭘 미뤘는지와 지금의 위험"
    }
  ],
  "blind_spots": ["이 단계에서 없으면 이상한 결정 유형"],
  "next_focus": {
    "title": "다음 집중 포인트",
    "rationale": "왜 지금인지. 데이터 근거 포함"
  }
}

severity must be exactly one of: info, warning, critical
patterns: 2-4 items. stale_tradeoffs: empty array if none. blind_spots: 1-3 items.
"""


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


def _repair_json(raw: str) -> str:
    """LLM이 생성한 JSON의 흔한 오류를 복구."""
    # 코드 펜스 제거
    if "```" in raw:
        parts = raw.split("```")
        for part in parts:
            stripped = part.strip()
            if stripped.startswith("json"):
                stripped = stripped[4:].strip()
            if stripped.startswith("{"):
                raw = stripped
                break

    # 첫 번째 { 부터 마지막 } 까지만 추출
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1:
        raw = raw[start:end + 1]

    # trailing comma before } or ] 제거
    raw = re.sub(r",\s*([\]}])", r"\1", raw)

    return raw


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
            + "\n\n"
            + _USER_SCHEMA
        )

        msg = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2500,
            temperature=0,
            system=_SYSTEM,
            messages=[{"role": "user", "content": user_content}],
        )
        raw = msg.content[0].text.strip()
        raw = _repair_json(raw)
        result = json.loads(raw)

        # next_focus 필드 보장
        if "next_focus" not in result:
            result["next_focus"] = {"title": "", "rationale": ""}

        return result
    except Exception as exc:
        logger.warning("pm_briefer failed: %s", exc)
        return None
