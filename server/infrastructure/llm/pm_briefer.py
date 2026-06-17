"""PM 브리핑 — 워크스페이스 결정 데이터를 PM 관점으로 분석."""
from __future__ import annotations

import json
import logging

logger = logging.getLogger(__name__)

_SYSTEM = """\
당신은 시니어 PM이자 테크 리드입니다.
주어진 프로젝트의 AI 협업 결정 로그를 분석해서 솔직하고 구체적인 의견을 냅니다.

절대 금지:
- 범용적인 조언 ("더 많은 테스트를 작성하세요")
- 칭찬 위주 어조
- 결정 목록에 없는 내용을 근거로 삼기
- 결론 없이 나열만 하기

반드시:
- 실제 결정 내용을 직접 인용해서 근거로 사용
- "이 결정이 문제다" "이걸 먼저 해야 한다" 같이 의견을 명확히
- 트레이드오프에 "나중에", "임시", "재검토" 류가 있으면 반드시 언급
- 없는 결정 유형(blind spot)도 패턴으로 포함

JSON만 출력. 마크다운 없이.
"""

_USER_TEMPLATE = """\
워크스페이스 결정 데이터:
총 {count}개 결정 / 기간: {date_range}

{decisions}

위 데이터를 PM 관점에서 분석해서 아래 JSON 형식으로 출력:

{{
  "summary": "<전체를 한 문장으로. 현재 프로젝트 상태에 대한 솔직한 진단>",
  "patterns": [
    {{
      "title": "<패턴 제목>",
      "detail": "<구체적인 근거 포함 설명. 결정 내용 직접 인용>",
      "severity": "info" | "warning" | "critical"
    }}
  ],
  "stale_tradeoffs": [
    {{
      "decision": "<결정 제목>",
      "made_at": "<날짜>",
      "note": "<트레이드오프에서 뭘 미뤘는지 + 지금 어떤 위험인지>"
    }}
  ],
  "blind_spots": [
    "<이 프로젝트에서 전혀 논의되지 않았지만 이 단계에서 있어야 할 결정 유형>"
  ],
  "next_focus": {{
    "title": "<다음에 집중해야 할 것>",
    "rationale": "<왜 지금인지. 결정 데이터 근거 포함>"
  }}
}}

patterns는 2-4개, stale_tradeoffs는 있는 것만, blind_spots는 1-3개.
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


async def generate_pm_brief(events: list[dict], api_key: str) -> dict | None:
    if not events:
        return None
    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=api_key)

        dates = [_date_str(e.get("created_at")) for e in events if e.get("created_at")]
        date_range = f"{min(dates)} ~ {max(dates)}" if dates else "?"
        decisions_text = _format_decisions(events)

        msg = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            system=_SYSTEM,
            messages=[{
                "role": "user",
                "content": _USER_TEMPLATE.format(
                    count=len(events),
                    date_range=date_range,
                    decisions=decisions_text[:8000],
                ),
            }],
        )
        raw = msg.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        if not raw.endswith("}"):
            last = raw.rfind("}")
            raw = raw[:last + 1] if last != -1 else raw + "}"
        return json.loads(raw)
    except Exception as exc:
        logger.warning("pm_briefer failed: %s", exc)
        return None
