"""AWS Bedrock 클라이언트 — Phase 2 LLM 정제 파이프라인에서 사용."""
from __future__ import annotations

import json

import aioboto3

_MODEL_ID = "anthropic.claude-sonnet-4-6"
_SESSION = aioboto3.Session()


async def refine_decision(prompt: str, response: str, diff: str | None) -> str:
    """Context Distillation: raw 수집 데이터 → 의사결정 요약 반환."""
    system = (
        "You are a decision knowledge extractor for a software team. "
        "Given an AI prompt, response, and git diff, extract the core decision: "
        "what was decided, why, and what alternatives were considered. "
        "Be concise and factual."
    )
    user_content = f"## Prompt\n{prompt}\n\n## Response\n{response}"
    if diff:
        user_content += f"\n\n## Diff\n{diff}"

    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "system": system,
        "messages": [{"role": "user", "content": user_content}],
    }

    async with _SESSION.client("bedrock-runtime", region_name="us-east-1") as client:
        response_obj = await client.invoke_model(
            modelId=_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(body),
        )
        result = json.loads(await response_obj["body"].read())
        return result["content"][0]["text"]
