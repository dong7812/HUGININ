-- Phase 1 초기 스키마

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TYPE workspace_role     AS ENUM ('owner', 'admin', 'member', 'guest');
CREATE TYPE project_permission AS ENUM ('full', 'contribute', 'comment', 'view');
CREATE TYPE event_status       AS ENUM ('pending', 'processing', 'refined', 'failed');

-- ── Users ──────────────────────────────────────────────────────────────
CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    name          VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Workspaces ─────────────────────────────────────────────────────────
CREATE TABLE workspaces (
    id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(255) NOT NULL,
    slug       VARCHAR(255) UNIQUE NOT NULL,
    owner_id   UUID         NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE workspace_members (
    workspace_id UUID           NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      UUID           NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    role         workspace_role NOT NULL DEFAULT 'member',
    joined_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE invite_codes (
    code         VARCHAR(64)    PRIMARY KEY,
    workspace_id UUID           NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    role         workspace_role NOT NULL,
    created_by   UUID           NOT NULL REFERENCES users(id),
    expires_at   TIMESTAMPTZ,
    used_by      UUID           REFERENCES users(id)
);

-- ── Projects ───────────────────────────────────────────────────────────
CREATE TABLE projects (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    git_remote   VARCHAR(512),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE project_members (
    project_id UUID               NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id    UUID               NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    permission project_permission NOT NULL DEFAULT 'view',
    granted_at TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- ── Decision Events ────────────────────────────────────────────────────
CREATE TABLE decision_events (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID         NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id   UUID         REFERENCES projects(id) ON DELETE SET NULL,
    user_id      UUID         NOT NULL REFERENCES users(id),
    commit_hash  VARCHAR(64),
    raw_prompt   TEXT         NOT NULL,
    raw_response TEXT         NOT NULL,
    diff         TEXT,
    status       event_status NOT NULL DEFAULT 'pending',
    embedding    vector(1536),          -- Phase 2 이후 채워짐
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (commit_hash)               -- 멱등성: 동일 커밋 중복 방지
);

-- HNSW 인덱스 (Phase 2 벡터 검색용, 지금부터 구조 확보)
CREATE INDEX ON decision_events USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON decision_events (workspace_id, created_at DESC);
CREATE INDEX ON decision_events (commit_hash) WHERE commit_hash IS NOT NULL;
