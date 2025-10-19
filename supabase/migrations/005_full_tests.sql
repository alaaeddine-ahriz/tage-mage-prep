-- Create full_tests table for complete tests (6 subtests)
CREATE TABLE IF NOT EXISTS full_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('TD', 'Blanc')),
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 600),
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create full_test_subtests table for individual subtests within a full test
CREATE TABLE IF NOT EXISTS full_test_subtests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_test_id UUID NOT NULL REFERENCES full_tests(id) ON DELETE CASCADE,
  subtest TEXT NOT NULL CHECK (subtest IN ('comprehension', 'calcul', 'logique', 'conditions', 'expression', 'argumentation')),
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0 AND correct_answers <= 15),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 60),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_full_tests_user_id ON full_tests(user_id);
CREATE INDEX idx_full_tests_date ON full_tests(date DESC);
CREATE INDEX idx_full_test_subtests_full_test_id ON full_test_subtests(full_test_id);

-- Enable RLS
ALTER TABLE full_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE full_test_subtests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for full_tests
CREATE POLICY "Users can view their own full tests"
  ON full_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own full tests"
  ON full_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own full tests"
  ON full_tests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own full tests"
  ON full_tests FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for full_test_subtests
CREATE POLICY "Users can view their own full test subtests"
  ON full_test_subtests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM full_tests
      WHERE full_tests.id = full_test_subtests.full_test_id
      AND full_tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own full test subtests"
  ON full_test_subtests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM full_tests
      WHERE full_tests.id = full_test_subtests.full_test_id
      AND full_tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own full test subtests"
  ON full_test_subtests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM full_tests
      WHERE full_tests.id = full_test_subtests.full_test_id
      AND full_tests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own full test subtests"
  ON full_test_subtests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM full_tests
      WHERE full_tests.id = full_test_subtests.full_test_id
      AND full_tests.user_id = auth.uid()
    )
  );

-- Add trigger to update updated_at on full_tests
CREATE OR REPLACE FUNCTION update_full_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER full_tests_updated_at
  BEFORE UPDATE ON full_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_full_tests_updated_at();

