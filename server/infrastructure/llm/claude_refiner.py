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
extract structured metadata that reveals WHAT was built, WHY it was needed, \
HOW AI specifically contributed, and what TRADEOFFS were considered.
Be concrete and specific — avoid generic phrases.

CRITICAL: Only extract what is explicitly stated or clearly implied in the provided \
prompt, response, and diff. Never infer from general knowledge or external context. \
If information is not present in the session, return null for that field.

Respond with valid JSON only — no explanation, no markdown fences.
"""

_USER_TEMPLATE = """\
## Developer: {user_name}

## Developer prompt:
{prompt}

## AI response:
{response}

## Code/infrastructure diff:
{diff}

Extract the following and return as JSON:

{{
  "frame": "A" | "B" | "C" | "D",
  "ai_contribution": <float 0.0–1.0>,
  "decision_type": "feature" | "bugfix" | "refactor" | "config" | "infrastructure" | "docs" | "test" | "other",
  "what_was_built": "<구체적 기술 결과물. 예: 'FastAPI ETL 파이프라인 + asyncpg 마이그레이션 + claude-haiku 기반 이벤트 분석기'. 1-2문장, 단순 반복 금지>",
  "problem_solved": "<해결한 문제와 맥락. 왜 이 작업이 필요했는지. 예: '대시보드가 raw prompt만 보여줘 AI 협업 가치가 보이지 않았음 → 의미있는 분석 데이터로 전환 필요'. 1-2문장>",
  "ai_role": "<어떻게 구현했는지. AI가 실제로 한 것과 {user_name}이 한 것의 역할 분담. 예: 'claude_refiner.py 전체 설계 및 구현, ETL 프롬프트 템플릿 작성 (AI) / API 키 설정 및 서버 재시작, 방향 결정 ({user_name})'. 2-3문장>",
  "tradeoffs": "<이 결정에서 고려한 대안과 선택 기준. 선택하지 않은 접근법과 그 이유, 현재 방식의 장단점. 없으면 null. 예: 'WebSocket 대신 SSE 선택 — 단방향 스트리밍에 충분하고 구현이 단순함. 양방향 통신이 필요해지면 WebSocket으로 전환 필요'. 1-3문장>",
  "rejected_alternatives": "<대화 또는 diff에서 명시적으로 언급되거나 제거된 접근법. 예: 'Redis session 방식 → 제거됨', 'axios 대신 fetch 선택 언급'. 대화에 없으면 null. 추측 금지>",
  "implicit_constraints": "<선택에 영향을 준 제약조건으로 대화에 직접 언급된 것. 예: '비용', '배포 환경 제약', '기존 코드와의 호환성', '마감 일정'. 언급되지 않은 제약은 추측하지 말 것. 없으면 null>"
}}

Frame definitions:
  A = AI advised/reviewed, human wrote the code and made decisions
  B = Human gave direction, AI implemented 30-70%% of the actual code
  C = AI proposed the approach AND implemented it, human reviewed/approved
  D = AI executed with minimal human direction (automated pipeline, script)

ai_contribution = fraction of actual code/decisions made by AI (0.0=none, 1.0=all)

IMPORTANT:
- All narrative fields must be specific to THIS session.
- In ai_role, always refer to the developer by name ({user_name}), never as "인간" or "개발자".
- tradeoffs: only include if there was a genuine choice between approaches. Set to null if trivial.
- rejected_alternatives / implicit_constraints: ONLY from what's in the session text. null if absent.
- Write in Korean.
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
            max_tokens=1500,
            system=_SYSTEM,
            messages=[
                {
                    "role": "user",
                    "content": _USER_TEMPLATE.format(
                        user_name=user_name or "개발자",
                        prompt=prompt[:2000],
                        response=response[:2000],
                        diff=(diff or "N/A")[:5000],
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
