-- branch: 수집 시점의 git 브랜치
ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS branch VARCHAR(255);

-- 토큰 수: 없으면 서버가 텍스트 길이로 추정 (chars / 4)
ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER;
ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS response_tokens INTEGER;

-- 브랜치 필터 쿼리 최적화
CREATE INDEX IF NOT EXISTS decision_events_workspace_branch_idx
    ON decision_events (workspace_id, branch)
    WHERE branch IS NOT NULL;

-- AI 결정에 대한 팀 코멘트
CREATE TABLE IF NOT EXISTS decision_comments (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id   UUID        NOT NULL REFERENCES decision_events(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id),
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS decision_comments_event_idx
    ON decision_comments (event_id, created_at);
