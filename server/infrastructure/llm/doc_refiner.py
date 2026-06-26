"""문서 섹션 ETL + 코드베이스 일관성 검증."""
from __future__ import annotations
import json
import logging

logger = logging.getLogger(__name__)

_SYSTEM = """\
You are analyzing a documentation section to extract decision context and validate it against actual code.

RULES:
1. Extract only what is explicitly stated in the section — no guessing.
2. For validation: compare the doc's claims against the provided codebase snippets.
   - consistent: code matches the doc claim
   - outdated: code contradicts the doc claim
   - unverifiable: no relevant code found to confirm or deny
3. Respond with valid JSON only.
"""

_TEMPLATE = """\
## Document section heading: {heading}

## Section content:
{content}

## Relevant codebase snippets (may be empty):
{codebase}

Extract and validate. Return JSON:
{{
  "what_was_decided": "<1줄. 이 섹션에서 내려진 결정. null if not a decision>",
  "why": "<왜 이 결정인지. null if not stated>",
  "alternatives": "<검토했다가 기각된 대안들. null if none mentioned>",
  "constraints": "<제약 조건 — 비용, 환경, 호환성 등. null if none>",
  "decision_type": "feature" | "bugfix" | "refactor" | "config" | "infrastructure" | "docs" | "other",
  "validation_status": "consistent" | "outdated" | "unverifiable",
  "validation_note": "<왜 그 판정인지 1줄. 코드 근거 또는 근거 없음>"
}}

Write Korean. Be concise.
"""


async def refine_doc_section(
    heading: str,
    content: str,
    codebase_snippets: str,
    api_key: str,
) -> dict | None:
    try:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=api_key)
        msg = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=800,
            system=_SYSTEM,
            messages=[{
                "role": "user",
                "content": _TEMPLATE.format(
                    heading=heading[:200],
                    content=content[:4000],
                    codebase=codebase_snippets[:3000] if codebase_snippets else "없음",
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
        logger.warning("refine_doc_section failed: %s", exc)
        return None
