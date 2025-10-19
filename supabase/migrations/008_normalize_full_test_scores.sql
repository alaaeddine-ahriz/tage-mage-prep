-- Migration: Normalize existing full test scores from 360 to 600
-- This corrects scores that were stored as raw sums (max 360) instead of normalized (max 600)

-- Update full_tests table
-- Formula: normalized_score = ROUND((raw_score / 360.0) * 600)
UPDATE full_tests
SET total_score = ROUND((total_score::numeric / 360.0) * 600)
WHERE total_score <= 360;

-- Update full_test_attempts table (if any attempts exist)
UPDATE full_test_attempts
SET total_score = ROUND((total_score::numeric / 360.0) * 600)
WHERE total_score <= 360;

-- Note: Subtests scores (out of 60) don't need normalization as they are correct

