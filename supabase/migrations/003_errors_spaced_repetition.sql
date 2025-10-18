-- Add spaced repetition fields to errors table

-- Add new columns for spaced repetition
ALTER TABLE errors 
  ADD COLUMN IF NOT EXISTS mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Create index for next_review_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_errors_next_review ON errors(user_id, next_review_at);

-- Set next_review_at to now for existing errors so they appear as "to review"
UPDATE errors 
SET next_review_at = NOW()
WHERE next_review_at IS NULL;

-- Drop the old "understood" column as it's replaced by mastery_level system
-- Commented out to preserve data - you can run this later if needed
-- ALTER TABLE errors DROP COLUMN IF EXISTS understood;
-- ALTER TABLE errors DROP COLUMN IF EXISTS reviewed_at;

-- Create error_reviews table (like notion_reviews)
CREATE TABLE IF NOT EXISTS error_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_id UUID REFERENCES errors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_at TIMESTAMP DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  new_mastery_level INTEGER NOT NULL,
  next_review_interval_days INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_error_reviews_error ON error_reviews(error_id, reviewed_at DESC);

-- Enable RLS on error_reviews
ALTER TABLE error_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for error_reviews
DROP POLICY IF EXISTS "Users can view own error reviews" ON error_reviews;
CREATE POLICY "Users can view own error reviews" ON error_reviews FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own error reviews" ON error_reviews;
CREATE POLICY "Users can insert own error reviews" ON error_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own error reviews" ON error_reviews;
CREATE POLICY "Users can update own error reviews" ON error_reviews FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own error reviews" ON error_reviews;
CREATE POLICY "Users can delete own error reviews" ON error_reviews FOR DELETE USING (auth.uid() = user_id);

-- Done!
-- Now errors work exactly like notions with spaced repetition

