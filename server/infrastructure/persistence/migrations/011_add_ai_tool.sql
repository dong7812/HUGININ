ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS ai_tool TEXT DEFAULT 'claude-code';
