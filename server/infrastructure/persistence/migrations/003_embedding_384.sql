-- fastembed BAAI/bge-small-en-v1.5 uses 384 dimensions (was 1536 for OpenAI ada-002)
-- Column is empty so dimension change is safe
DROP INDEX IF EXISTS decision_events_embedding_idx;
ALTER TABLE decision_events ALTER COLUMN embedding TYPE vector(384);
CREATE INDEX IF NOT EXISTS decision_events_embedding_idx
    ON decision_events USING hnsw (embedding vector_cosine_ops)
    WHERE embedding IS NOT NULL;
