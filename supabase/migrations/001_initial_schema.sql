-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tests (TD and Blancs)
CREATE TABLE tests (
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

CREATE INDEX idx_tests_user_date ON tests(user_id, date DESC);
CREATE INDEX idx_tests_subtest ON tests(user_id, subtest);

-- Erreurs
CREATE TABLE errors (
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

CREATE INDEX idx_errors_user_subtest ON errors(user_id, subtest);
CREATE INDEX idx_errors_understood ON errors(user_id, understood);

-- Notions
CREATE TABLE notions (
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

CREATE INDEX idx_notions_user_subtest ON notions(user_id, subtest);
CREATE INDEX idx_notions_next_review ON notions(user_id, next_review_at);

-- Historique des révisions de notions
CREATE TABLE notion_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_id UUID REFERENCES notions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_at TIMESTAMP DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  new_mastery_level INTEGER NOT NULL,
  next_review_interval_days INTEGER NOT NULL
);

CREATE INDEX idx_notion_reviews_notion ON notion_reviews(notion_id, reviewed_at DESC);

-- Enable Row Level Security
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE notions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notion_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tests
CREATE POLICY "Users can view own tests" ON tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tests" ON tests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tests" ON tests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tests" ON tests FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for errors
CREATE POLICY "Users can view own errors" ON errors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own errors" ON errors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own errors" ON errors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own errors" ON errors FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notions
CREATE POLICY "Users can view own notions" ON notions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notions" ON notions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notions" ON notions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notions" ON notions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for notion_reviews
CREATE POLICY "Users can view own notion reviews" ON notion_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notion reviews" ON notion_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notion reviews" ON notion_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notion reviews" ON notion_reviews FOR DELETE USING (auth.uid() = user_id);


