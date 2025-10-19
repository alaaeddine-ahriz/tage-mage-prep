-- Migration: Add attempts system for full tests
-- Similar to test_attempts but for full_tests

-- Add name column to full_tests if not exists
ALTER TABLE full_tests ADD COLUMN IF NOT EXISTS name TEXT;

-- Create full_test_attempts table
CREATE TABLE IF NOT EXISTS full_test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_test_id UUID NOT NULL REFERENCES full_tests(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 600),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create full_test_attempt_subtests table (details for each subtest in an attempt)
CREATE TABLE IF NOT EXISTS full_test_attempt_subtests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES full_test_attempts(id) ON DELETE CASCADE,
  subtest TEXT NOT NULL CHECK (subtest IN ('comprehension', 'calcul', 'logique', 'conditions', 'expression', 'argumentation')),
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0 AND correct_answers <= 15),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 60),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_full_test_attempts_full_test_id ON full_test_attempts(full_test_id);
CREATE INDEX IF NOT EXISTS idx_full_test_attempts_date ON full_test_attempts(date DESC);
CREATE INDEX IF NOT EXISTS idx_full_test_attempt_subtests_attempt_id ON full_test_attempt_subtests(attempt_id);

-- Enable RLS
ALTER TABLE full_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE full_test_attempt_subtests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for full_test_attempts
CREATE POLICY "Users can view their own full test attempts"
  ON full_test_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM full_tests
      WHERE full_tests.id = full_test_attempts.full_test_id
      AND full_tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own full test attempts"
  ON full_test_attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM full_tests
      WHERE full_tests.id = full_test_attempts.full_test_id
      AND full_tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own full test attempts"
  ON full_test_attempts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM full_tests
      WHERE full_tests.id = full_test_attempts.full_test_id
      AND full_tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own full test attempts"
  ON full_test_attempts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM full_tests
      WHERE full_tests.id = full_test_attempts.full_test_id
      AND full_tests.user_id = auth.uid()
    )
  );

-- RLS Policies for full_test_attempt_subtests
CREATE POLICY "Users can view their own full test attempt subtests"
  ON full_test_attempt_subtests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM full_test_attempts
      JOIN full_tests ON full_tests.id = full_test_attempts.full_test_id
      WHERE full_test_attempts.id = full_test_attempt_subtests.attempt_id
      AND full_tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own full test attempt subtests"
  ON full_test_attempt_subtests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM full_test_attempts
      JOIN full_tests ON full_tests.id = full_test_attempts.full_test_id
      WHERE full_test_attempts.id = full_test_attempt_subtests.attempt_id
      AND full_tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own full test attempt subtests"
  ON full_test_attempt_subtests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM full_test_attempts
      JOIN full_tests ON full_tests.id = full_test_attempts.full_test_id
      WHERE full_test_attempts.id = full_test_attempt_subtests.attempt_id
      AND full_tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own full test attempt subtests"
  ON full_test_attempt_subtests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM full_test_attempts
      JOIN full_tests ON full_tests.id = full_test_attempts.full_test_id
      WHERE full_test_attempts.id = full_test_attempt_subtests.attempt_id
      AND full_tests.user_id = auth.uid()
    )
  );

