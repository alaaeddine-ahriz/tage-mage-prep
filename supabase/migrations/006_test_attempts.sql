-- Add name field to tests table
ALTER TABLE tests ADD COLUMN IF NOT EXISTS name TEXT;

-- Create test_attempts table for tracking multiple attempts of the same test
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 60),
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_test_attempts_test_id ON test_attempts(test_id);
CREATE INDEX idx_test_attempts_date ON test_attempts(date DESC);

-- Enable RLS
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for test_attempts
CREATE POLICY "Users can view their own test attempts"
  ON test_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = test_attempts.test_id
      AND tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own test attempts"
  ON test_attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = test_attempts.test_id
      AND tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own test attempts"
  ON test_attempts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = test_attempts.test_id
      AND tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own test attempts"
  ON test_attempts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = test_attempts.test_id
      AND tests.user_id = auth.uid()
    )
  );

