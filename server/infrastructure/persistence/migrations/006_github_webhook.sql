-- Migration 006: GitHub Webhook PR 이벤트 지원
ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS event_type VARCHAR DEFAULT 'commit';
ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS pr_number  INT;
ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS pr_url     TEXT;
ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS github_author VARCHAR;

CREATE INDEX IF NOT EXISTS decision_events_event_type_idx
    ON decision_events (workspace_id, event_type, created_at DESC);
