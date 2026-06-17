-- 이메일 인증, Google OAuth, CLI 세션

-- 기존 유저는 인증된 상태로 처리
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE;
ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_idx ON users (google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_verification_token_idx ON users (verification_token) WHERE verification_token IS NOT NULL;

-- CLI 브라우저 로그인용 임시 세션
CREATE TABLE IF NOT EXISTS cli_auth_sessions (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
    jwt_token  TEXT,
    status     VARCHAR(20) NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cli_auth_sessions_status_idx ON cli_auth_sessions (status, expires_at);
