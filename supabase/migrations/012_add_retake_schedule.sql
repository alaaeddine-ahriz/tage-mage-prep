-- Clean up legacy retake columns (now computed dynamically)
ALTER TABLE tests
  DROP COLUMN IF EXISTS next_retake_at,
  DROP COLUMN IF EXISTS retake_interval_days;

DROP INDEX IF EXISTS idx_tests_next_retake;

ALTER TABLE full_tests
  DROP COLUMN IF EXISTS next_retake_at,
  DROP COLUMN IF EXISTS retake_interval_days;

DROP INDEX IF EXISTS idx_full_tests_next_retake;

-- Table to store per-user preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_retake_delay_days INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS and policies for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their preferences" ON user_preferences;
CREATE POLICY "Users can view their preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their preferences" ON user_preferences;
CREATE POLICY "Users can insert their preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their preferences" ON user_preferences;
CREATE POLICY "Users can update their preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their preferences" ON user_preferences;
CREATE POLICY "Users can delete their preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION set_user_preferences_updated_at();
