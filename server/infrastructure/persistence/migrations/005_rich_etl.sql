-- Migration 005: 풍부한 ETL 서사 필드 추가
ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS what_was_built TEXT;
ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS problem_solved TEXT;
ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS ai_role TEXT;

-- 기존 frame IS NOT NULL → rich ETL 완료 여부는 what_was_built IS NULL 로 구분
CREATE INDEX IF NOT EXISTS decision_events_rich_idx
    ON decision_events (workspace_id, created_at DESC)
    WHERE what_was_built IS NULL;
