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
You are an expert analyst of AI-assisted software development sessions, \
specializing in extracting meaningful collaboration insights.

Given a coding session (developer prompt, AI response, code diff), \
extract structured metadata that reveals WHAT was built, WHY it was built, \
and HOW AI specifically contributed. Be concrete and specific — avoid generic phrases.

Respond with valid JSON only — no explanation, no markdown fences.
"""

_USER_TEMPLATE = """\
## Developer: {user_name}

## Developer prompt:
{prompt}

## AI response:
{response}

## Code diff:
{diff}

Extract the following and return as JSON:

{{
  "frame": "A" | "B" | "C" | "D",
  "ai_contribution": <float 0.0–1.0>,
  "decision_type": "feature" | "bugfix" | "refactor" | "config" | "docs" | "test" | "other",
  "what_was_built": "<구체적 기술 결과물. 예: 'FastAPI ETL 파이프라인 + asyncpg 마이그레이션 + claude-haiku 기반 이벤트 분석기'. 단순 반복 금지>",
  "problem_solved": "<해결한 문제/맥락. 예: '대시보드가 raw prompt만 보여줘 AI 협업 가치가 보이지 않았음 → 의미있는 분석 데이터로 전환 필요'. 왜 이 작업이 필요했는지>",
  "ai_role": "<AI가 실제로 한 것과 {user_name}이 한 것. 예: 'claude_refiner.py 전체 설계 및 구현, ETL 프롬프트 템플릿 작성, SQL 마이그레이션 생성 — {user_name}: API 키 설정 및 서버 재시작 담당'>"
}}

Frame definitions:
  A = AI advised/reviewed, human wrote the code and made decisions
  B = Human gave direction, AI implemented 30-70%% of the actual code
  C = AI proposed the approach AND implemented it, human reviewed/approved
  D = AI executed with minimal human direction (automated pipeline, script)

ai_contribution = fraction of actual code/decisions made by AI (0.0=none, 1.0=all)

IMPORTANT: All three narrative fields (what_was_built, problem_solved, ai_role) MUST be \
specific to THIS session. In ai_role, always refer to the developer by name ({user_name}), \
never as "인간" or "개발자". Never write generic text.
Write in Korean.
"""


async def refine_event(
    prompt: str,
    response: str,
    diff: str | None,
    api_key: str,
    user_name: str = "",
) -> dict | None:
    """Claude Haiku로 이벤트 분석. 실패 시 None 반환."""
    try:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=api_key)
        msg = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1024,
            system=_SYSTEM,
            messages=[
                {
                    "role": "user",
                    "content": _USER_TEMPLATE.format(
                        user_name=user_name or "개발자",
                        prompt=prompt[:2000],
                        response=response[:2000],
                        diff=(diff or "N/A")[:600],
                    ),
                }
            ],
        )
        raw = msg.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        # max_tokens 초과로 JSON이 잘린 경우 복구 시도
        if not raw.endswith("}"):
            last_brace = raw.rfind("}")
            raw = raw[:last_brace + 1] if last_brace != -1 else raw + "}"
        return json.loads(raw)
    except Exception as exc:
        logger.warning("refine_event failed: %s", exc)
        return None
