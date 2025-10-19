-- Migration to update test scores from /15 to /60
-- This migration updates existing scores by multiplying them by 4

-- First, drop the existing constraints
ALTER TABLE tests
DROP CONSTRAINT IF EXISTS tests_score_check;

ALTER TABLE test_attempts
DROP CONSTRAINT IF EXISTS test_attempts_score_check;

-- Update tests table (multiply existing scores by 4)
UPDATE tests
SET score = score * 4
WHERE score <= 15;

-- Update test_attempts table (multiply existing scores by 4)
UPDATE test_attempts
SET score = score * 4
WHERE score <= 15;

-- Add the new CHECK constraints
ALTER TABLE tests
ADD CONSTRAINT tests_score_check CHECK (score >= 0 AND score <= 60);

ALTER TABLE test_attempts
ADD CONSTRAINT test_attempts_score_check CHECK (score >= 0 AND score <= 60);

