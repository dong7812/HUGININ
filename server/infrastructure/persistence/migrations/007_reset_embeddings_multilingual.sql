-- 임베딩 모델 교체: bge-small-en-v1.5 → intfloat/multilingual-e5-small
-- 마커 테이블로 1회만 실행 보장
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_migration_embedding_v2') THEN
    UPDATE decision_events SET embedding = NULL;
    CREATE TABLE _migration_embedding_v2 (applied_at timestamptz DEFAULT now());
    INSERT INTO _migration_embedding_v2 DEFAULT VALUES;
  END IF;
END $$;
