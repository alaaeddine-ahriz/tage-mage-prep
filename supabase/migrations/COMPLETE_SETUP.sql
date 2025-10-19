-- ============================================
-- COMPLETE SETUP FOR TAGE MAGE TRACKER
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- 1. ENABLE UUID EXTENSION
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE TABLES
-- ============================================

-- Tests (TD and Blancs)
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMP DEFAULT NOW(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('TD', 'Blanc')),
  subtest VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 15),
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tests_user_date ON tests(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_tests_subtest ON tests(user_id, subtest);

-- Erreurs
CREATE TABLE IF NOT EXISTS errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subtest VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  image_url TEXT,
  correct_answer TEXT,
  explanation TEXT,
  understood BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMP,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_errors_user_subtest ON errors(user_id, subtest);
CREATE INDEX IF NOT EXISTS idx_errors_understood ON errors(user_id, understood);

-- Notions
CREATE TABLE IF NOT EXISTS notions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subtest VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  last_reviewed_at TIMESTAMP,
  next_review_at TIMESTAMP,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notions_user_subtest ON notions(user_id, subtest);
CREATE INDEX IF NOT EXISTS idx_notions_next_review ON notions(user_id, next_review_at);

-- Historique des révisions de notions
CREATE TABLE IF NOT EXISTS notion_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_id UUID REFERENCES notions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_at TIMESTAMP DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  new_mastery_level INTEGER NOT NULL,
  next_review_interval_days INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notion_reviews_notion ON notion_reviews(notion_id, reviewed_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE notions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_reviews ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES FOR TABLES
-- ============================================

-- Tests policies
DROP POLICY IF EXISTS "Users can view own tests" ON tests;
CREATE POLICY "Users can view own tests" ON tests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tests" ON tests;
CREATE POLICY "Users can insert own tests" ON tests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tests" ON tests;
CREATE POLICY "Users can update own tests" ON tests FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tests" ON tests;
CREATE POLICY "Users can delete own tests" ON tests FOR DELETE USING (auth.uid() = user_id);

-- Errors policies
DROP POLICY IF EXISTS "Users can view own errors" ON errors;
CREATE POLICY "Users can view own errors" ON errors FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own errors" ON errors;
CREATE POLICY "Users can insert own errors" ON errors FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own errors" ON errors;
CREATE POLICY "Users can update own errors" ON errors FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own errors" ON errors;
CREATE POLICY "Users can delete own errors" ON errors FOR DELETE USING (auth.uid() = user_id);

-- Notions policies
DROP POLICY IF EXISTS "Users can view own notions" ON notions;
CREATE POLICY "Users can view own notions" ON notions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notions" ON notions;
CREATE POLICY "Users can insert own notions" ON notions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notions" ON notions;
CREATE POLICY "Users can update own notions" ON notions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notions" ON notions;
CREATE POLICY "Users can delete own notions" ON notions FOR DELETE USING (auth.uid() = user_id);

-- Notion reviews policies
DROP POLICY IF EXISTS "Users can view own notion reviews" ON notion_reviews;
CREATE POLICY "Users can view own notion reviews" ON notion_reviews FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notion reviews" ON notion_reviews;
CREATE POLICY "Users can insert own notion reviews" ON notion_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notion reviews" ON notion_reviews;
CREATE POLICY "Users can update own notion reviews" ON notion_reviews FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notion reviews" ON notion_reviews;
CREATE POLICY "Users can delete own notion reviews" ON notion_reviews FOR DELETE USING (auth.uid() = user_id);

-- 5. CREATE STORAGE POLICIES
-- ============================================

-- Note: You must first create the bucket 'error-images' manually in Storage dashboard
-- Make it PUBLIC

-- Storage policies for error-images bucket
DROP POLICY IF EXISTS "Users can upload own error images" ON storage.objects;
CREATE POLICY "Users can upload own error images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'error-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own error images" ON storage.objects;
CREATE POLICY "Users can update own error images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'error-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own error images" ON storage.objects;
CREATE POLICY "Users can delete own error images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'error-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Anyone can view error images" ON storage.objects;
CREATE POLICY "Anyone can view error images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'error-images');

-- ============================================
-- SETUP COMPLETE! 
-- ============================================
-- Don't forget to:
-- 1. Create the 'error-images' bucket in Storage (Public)
-- 2. Configure Google OAuth in Authentication > Providers
-- 3. Add environment variables to your .env.local
-- ============================================


