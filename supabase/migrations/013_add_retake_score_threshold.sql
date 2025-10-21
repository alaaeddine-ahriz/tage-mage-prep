-- Add retake_score_threshold column to user_preferences table
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS retake_score_threshold INTEGER NOT NULL DEFAULT 90;

-- Add check constraint to ensure threshold is between 1 and 100
ALTER TABLE user_preferences
ADD CONSTRAINT retake_score_threshold_range 
CHECK (retake_score_threshold >= 1 AND retake_score_threshold <= 100);

