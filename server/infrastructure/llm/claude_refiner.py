"""Claude API를 이용한 이벤트 ETL 분석.

frame 정의:
  A — Human-led:  AI가 조언/리뷰, 사람이 결정·코딩
  B — AI-assisted: 사람이 방향 지시, AI가 30-70% 구현
  C — AI-led:     AI가 제안·구현, 사람이 검토·승인
  D — Automated:  AI가 사람 개입 최소로 전자동 처리

입력: 실제 DEV/AI 대화 전체 + 코드 diff
목표: 코드나 git history에서 알 수 없는 의사결정 맥락만 추출
"""
from __future__ import annotations

import json
import logging

logger = logging.getLogger(__name__)

_SYSTEM = """\
You are analyzing a real conversation between a developer (DEV) and Claude AI \
to extract DECISION CONTEXT — the reasoning, alternatives, and constraints \
that exist ONLY in this conversation, not in the code or git history.

CRITICAL RULES:
1. Do NOT describe what the code does — that is visible in the diff.
2. DO extract WHY this approach was chosen, WHAT was rejected, WHAT constraints existed.
3. Base every field on actual conversation content. Quote or closely paraphrase.
4. If a field's information is not explicitly in the conversation, return null. No guessing.
5. Respond with valid JSON only — no markdown, no explanation.
"""

_USER_TEMPLATE = """\
## Developer: {user_name}

## Conversation (DEV = developer, AI = Claude):
{conversation}

## Code diff (for frame/contribution context only):
{diff}

Analyze the conversation above and return JSON:

{{
  "frame": "A" | "B" | "C" | "D",
  "ai_contribution": <float 0.0–1.0, how much of the actual implementation AI did>,
  "decision_type": "feature" | "bugfix" | "refactor" | "config" | "infrastructure" | "docs" | "test" | "other",
  "what_was_built": "<1줄. 커밋의 기술적 결과물. 예: 'ETL 파이프라인에 rejected_alternatives 필드 추가'>",
  "problem_solved": "<DEV의 실제 발화에서 드러난 의도나 문제. 예: 'DEV가 \"코드 분석 AI와 차별점이 명확해야 한다\"고 했음'. null if not in conversation>",
  "tradeoffs": "<대화에서 실제로 논의된 의사결정 과정을 하나의 흐름으로. 어떤 대안을 검토했다가 왜 기각했는지, 어떤 제약이 있었는지, 최종적으로 어떤 이유로 이 방향을 선택했는지 — 대화에 근거해서 서술. null if not discussed>",
  "rejected_alternatives": "<대화에서 명시적으로 버린 접근법 목록 (내부 DB용). null if absent>",
  "implicit_constraints": "<대화에서 언급된 제약 목록 (내부 DB용) — 비용, 배포 환경, 호환성, 일정 등. null if not mentioned>"
}}

Frame:
  A = AI가 조언만, DEV가 직접 코딩·결정
  B = DEV가 방향 지시, AI가 30-70%% 구현
  C = AI가 접근법 제안 + 구현, DEV가 검토·승인
  D = AI가 거의 자동으로 실행, DEV 개입 최소

Write Korean. Be specific. Short is better than padded.
"""


async def refine_event(
    prompt: str,
    response: str,
    diff: str | None,
    api_key: str,
    user_name: str = "",
) -> dict | None:
    """Claude Haiku로 대화 분석. 실패 시 None 반환."""
    try:
        import anthropic

        # prompt에 전체 대화가 들어있음 (hook v2)
        # response는 빈 문자열이거나 레거시 단일 응답
        conversation = prompt
        if response and not prompt.startswith("[DEV]") and not prompt.startswith("[AI]"):
            # 레거시: 단일 prompt/response 쌍 → 대화 형식으로 변환
            conversation = f"[DEV] {prompt[:3000]}\n\n[AI] {response[:3000]}"

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
                        conversation=conversation[:8000],
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
        if not raw.endswith("}"):
            last_brace = raw.rfind("}")
            raw = raw[:last_brace + 1] if last_brace != -1 else raw + "}"
        return json.loads(raw)
    except Exception as exc:
        logger.warning("refine_event failed: %s", exc)
        return None
