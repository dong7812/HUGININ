-- ETL 분석 결과 컬럼
-- frame: A(Human-led) B(AI-assisted) C(AI-led) D(Automated)
ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS frame           CHAR(1);
ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS ai_contribution FLOAT;
ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS decision_summary TEXT;
ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS decision_type   VARCHAR(20);

CREATE INDEX IF NOT EXISTS decision_events_frame_idx
    ON decision_events (workspace_id, frame)
    WHERE frame IS NOT NULL;
