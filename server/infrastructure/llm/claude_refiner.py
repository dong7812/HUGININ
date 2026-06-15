"""Claude API를 이용한 이벤트 ETL 분석.

frame 정의:
  A — Human-led:  AI가 조언/리뷰, 사람이 결정·코딩
  B — AI-assisted: 사람이 방향 지시, AI가 30-70% 구현
  C — AI-led:     AI가 제안·구현, 사람이 검토·승인
  D — Automated:  AI가 사람 개입 최소로 전자동 처리
"""
from __future__ import annotations

import json
import logging

logger = logging.getLogger(__name__)

_SYSTEM = """\
You are an expert analyst of AI-assisted software development sessions.
Given a coding session (user prompt, AI response, and optional diff), \
extract structured metadata. Respond with valid JSON only — no explanation, no markdown.
"""

_USER_TEMPLATE = """\
## User prompt:
{prompt}

## AI response:
{response}

## Code diff (stat):
{diff}

Return JSON:
{{
  "frame": "A" | "B" | "C" | "D",
  "ai_contribution": <float 0.0–1.0>,
  "decision_summary": "<1–2 sentences in Korean>",
  "decision_type": "feature" | "bugfix" | "refactor" | "config" | "docs" | "test" | "other"
}}

Frame:
A = AI advised, human coded/decided
B = Human directed, AI implemented significant portion
C = AI proposed+implemented, human approved
D = AI fully automated with minimal human direction

ai_contribution = estimated fraction of actual code/decision made by AI (0=none, 1=all)
"""


async def refine_event(
    prompt: str,
    response: str,
    diff: str | None,
    api_key: str,
) -> dict | None:
    """Claude Haiku로 이벤트 분석. 실패 시 None 반환."""
    try:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=api_key)
        msg = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            system=_SYSTEM,
            messages=[
                {
                    "role": "user",
                    "content": _USER_TEMPLATE.format(
                        prompt=prompt[:1200],
                        response=response[:1200],
                        diff=(diff or "N/A")[:400],
                    ),
                }
            ],
        )
        raw = msg.content[0].text.strip()
        # JSON 블록 제거 (모델이 ```json 으로 감쌀 경우 대비)
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception as exc:
        logger.warning("refine_event failed: %s", exc)
        return None
