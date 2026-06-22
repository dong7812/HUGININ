"""
기존 이벤트에 rejected_alternatives + implicit_constraints 를 backfill.

Railway에서 실행:
  railway run python server/scripts/backfill_decision_context.py

로컬에서 .env 로 실행:
  DATABASE_URL=... ANTHROPIC_API_KEY=... python server/scripts/backfill_decision_context.py
"""
from __future__ import annotations

import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


async def main() -> None:
    import asyncpg

    db_url = os.environ.get("DATABASE_URL")
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not db_url or not api_key:
        print("ERROR: DATABASE_URL and ANTHROPIC_API_KEY required")
        sys.exit(1)

    # asyncpg는 postgresql:// 스킴 필요
    db_url = db_url.replace("postgres://", "postgresql://")

    from infrastructure.llm.claude_refiner import refine_event

    pool = await asyncpg.create_pool(db_url)
    try:
        rows = await pool.fetch(
            """
            SELECT id, raw_prompt, raw_response, diff
            FROM decision_events
            WHERE status = 'refined'
              AND rejected_alternatives IS NULL
              AND raw_prompt IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 200
            """
        )
        print(f"대상 이벤트: {len(rows)}개")

        ok = 0
        skip = 0
        for row in rows:
            event_id = row["id"]
            prompt = row["raw_prompt"] or ""
            response = row["raw_response"] or ""
            diff = row["diff"]

            try:
                result = await refine_event(prompt, response, diff, api_key)
                if not result:
                    skip += 1
                    continue

                rejected = result.get("rejected_alternatives") or None
                constraints = result.get("implicit_constraints") or None

                if rejected or constraints:
                    await pool.execute(
                        """
                        UPDATE decision_events
                        SET rejected_alternatives = $1,
                            implicit_constraints  = $2
                        WHERE id = $3
                        """,
                        rejected,
                        constraints,
                        event_id,
                    )
                    print(f"  ✓ {str(event_id)[:8]}  rejected={bool(rejected)}  constraints={bool(constraints)}")
                    ok += 1
                else:
                    skip += 1
                    print(f"  — {str(event_id)[:8]}  (null, skipped)")

            except Exception as e:
                print(f"  ✗ {str(event_id)[:8]}  {e}")
                skip += 1

        print(f"\n완료: {ok}개 업데이트, {skip}개 스킵")
    finally:
        await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
