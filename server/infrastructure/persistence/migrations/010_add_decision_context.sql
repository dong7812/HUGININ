ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS rejected_alternatives TEXT;
ALTER TABLE decision_events ADD COLUMN IF NOT EXISTS implicit_constraints TEXT;
