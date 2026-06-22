"""
로컬 JSONL 파일에서 전체 대화를 추출해서 기존 이벤트를 재분석.

구 hook은 마지막 1쌍만 저장했음. 이 스크립트는:
1. DB의 각 이벤트 created_at으로 당시 JSONL 파일을 매칭
2. 해당 JSONL에서 전체 DEV/AI 대화 추출
3. 새 ETL(대화 분석 방식)로 재처리
4. DB 업데이트

실행:
  DATABASE_URL=... ANTHROPIC_API_KEY=... python server/scripts/backfill_full_conversation.py
  또는
  DATABASE_URL=... ANTHROPIC_API_KEY=... python server/scripts/backfill_full_conversation.py --project /path/to/jsonl/dir
"""
from __future__ import annotations

import asyncio
import glob
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

DEFAULT_JSONL_DIR = Path.home() / ".claude" / "projects"


def extract_conversation(jsonl_path: str, max_chars: int = 8000) -> str:
    """JSONL에서 전체 DEV/AI 대화를 추출해 포맷팅."""
    turns = []
    try:
        with open(jsonl_path, encoding="utf-8") as f:
            lines = [json.loads(l) for l in f if l.strip()]
    except Exception:
        return ""

    for l in lines:
        if l.get("type") not in ("user", "assistant"):
            continue
        msg = l.get("message", {})
        role = msg.get("role")
        content = msg.get("content", "")

        if isinstance(content, str):
            text = content.strip()
        elif isinstance(content, list):
            parts = []
            for c in content:
                if isinstance(c, dict) and c.get("type") == "text":
                    t = c.get("text", "").strip()
                    if t:
                        parts.append(t)
            text = "\n".join(parts)
        else:
            text = ""

        if text and len(text) > 10:
            turns.append((role, text))

    # 연속 같은 role 병합
    merged: list[list] = []
    for role, text in turns:
        if merged and merged[-1][0] == role:
            merged[-1][1] += "\n" + text
        else:
            merged.append([role, text])

    out = []
    for role, text in merged:
        label = "DEV" if role == "user" else "AI"
        out.append(f"[{label}] {text[:600]}")

    full = "\n\n".join(out)
    return full[-max_chars:]


def find_jsonl_for_event(
    event_ts: datetime,
    jsonl_files: list[tuple[float, str]],
    window_hours: int = 24,
) -> str | None:
    """이벤트 타임스탬프에 가장 가까운 JSONL 파일 반환.

    JSONL 수정시각이 이벤트보다 이전이어야 하고(커밋 전 작업),
    window_hours 이내여야 함.
    """
    ts = event_ts.timestamp()
    window = window_hours * 3600

    candidates = [
        (mtime, path)
        for mtime, path in jsonl_files
        if mtime <= ts + 300 and ts - mtime <= window  # 5분 여유, 24시간 이내
    ]
    if not candidates:
        return None

    # 이벤트 시각과 가장 가까운 것 선택
    candidates.sort(key=lambda x: abs(ts - x[0]))
    return candidates[0][1]


async def main() -> None:
    import asyncpg

    db_url = os.environ.get("DATABASE_URL", "")
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not db_url or not api_key:
        print("ERROR: DATABASE_URL and ANTHROPIC_API_KEY required")
        sys.exit(1)

    db_url = db_url.replace("postgres://", "postgresql://")

    # JSONL 디렉토리 — 커맨드라인으로 override 가능
    jsonl_dir = Path(sys.argv[sys.argv.index("--project") + 1]) if "--project" in sys.argv else DEFAULT_JSONL_DIR

    # 모든 프로젝트 폴더에서 JSONL 수집
    all_jsonls: list[tuple[float, str]] = []
    for path in glob.glob(str(jsonl_dir / "**" / "*.jsonl"), recursive=True):
        try:
            mtime = os.path.getmtime(path)
            all_jsonls.append((mtime, path))
        except OSError:
            pass

    print(f"로컬 JSONL: {len(all_jsonls)}개")
    if not all_jsonls:
        print("JSONL 파일 없음 — 종료")
        sys.exit(1)

    from infrastructure.llm.claude_refiner import refine_event

    pool = await asyncpg.create_pool(db_url)
    try:
        rows = await pool.fetch(
            """
            SELECT id, created_at, raw_prompt, raw_response, diff
            FROM decision_events
            WHERE status = 'refined'
              AND raw_prompt IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 200
            """
        )
        print(f"대상 이벤트: {len(rows)}개\n")

        ok = skip = no_jsonl = 0

        for row in rows:
            event_id = row["id"]
            event_ts = row["created_at"]
            if event_ts.tzinfo is None:
                event_ts = event_ts.replace(tzinfo=timezone.utc)

            # JSONL 매칭
            jsonl_path = find_jsonl_for_event(event_ts, all_jsonls)
            if not jsonl_path:
                print(f"  — {str(event_id)[:8]}  ({event_ts.strftime('%m-%d %H:%M')}) JSONL 없음")
                no_jsonl += 1
                continue

            # 전체 대화 추출
            conversation = extract_conversation(jsonl_path)
            if not conversation or len(conversation) < 100:
                # 대화가 너무 짧으면 기존 raw_prompt 사용
                raw = row["raw_prompt"] or ""
                resp = row["raw_response"] or ""
                if raw.startswith("[DEV]") or raw.startswith("[AI]"):
                    conversation = raw
                else:
                    conversation = f"[DEV] {raw[:3000]}\n\n[AI] {resp[:3000]}"

            jsonl_name = Path(jsonl_path).name[:8]
            print(f"  → {str(event_id)[:8]}  ({event_ts.strftime('%m-%d %H:%M')})  JSONL:{jsonl_name}  대화:{len(conversation)}자")

            try:
                result = await refine_event(
                    conversation,
                    "",
                    row["diff"],
                    api_key,
                )
                if not result:
                    skip += 1
                    continue

                rejected = result.get("rejected_alternatives") or None
                constraints = result.get("implicit_constraints") or None
                what = result.get("what_was_built") or None
                problem = result.get("problem_solved") or None
                tradeoffs = result.get("tradeoffs") or None
                frame = result.get("frame") or None
                try:
                    ai_contrib = float(result.get("ai_contribution", 0.5))
                except (TypeError, ValueError):
                    ai_contrib = 0.5
                decision_type = result.get("decision_type") or None

                await pool.execute(
                    """
                    UPDATE decision_events
                    SET what_was_built        = COALESCE($1, what_was_built),
                        problem_solved        = COALESCE($2, problem_solved),
                        tradeoffs             = COALESCE($3, tradeoffs),
                        rejected_alternatives = $4,
                        implicit_constraints  = $5,
                        frame                 = COALESCE($6, frame),
                        ai_contribution       = COALESCE($7, ai_contribution),
                        decision_type         = COALESCE($8, decision_type)
                    WHERE id = $9
                    """,
                    what, problem, tradeoffs,
                    rejected, constraints,
                    frame, ai_contrib, decision_type,
                    event_id,
                )
                flags = []
                if rejected: flags.append("rej✓")
                if constraints: flags.append("con✓")
                if problem and len(problem) > 50: flags.append("prob✓")
                print(f"    ✓ {' '.join(flags) or '(updated)'}")
                ok += 1

            except Exception as e:
                print(f"    ✗ {e}")
                skip += 1

        print(f"\n완료: {ok}개 업데이트, {skip}개 실패, {no_jsonl}개 JSONL 없음")
    finally:
        await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
