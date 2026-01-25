-- =============================================
-- 뚝딱동화 초기 스키마
-- Created: 2026-01-25
-- =============================================

-- 1. Users 테이블 (Supabase Auth와 연동)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  provider TEXT DEFAULT 'email',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stories 테이블 (동화)
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ko TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ko TEXT,
  description_en TEXT,
  category TEXT CHECK (category IN ('adventure', 'lesson', 'emotion', 'creativity')),
  age_group TEXT CHECK (age_group IN ('3-5', '5-7', '7+')),
  thumbnail_url TEXT,
  is_free BOOLEAN DEFAULT false,
  page_count INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Story Pages 테이블 (동화 페이지)
CREATE TABLE story_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  image_url TEXT,
  text_ko TEXT,
  text_en TEXT,
  audio_url_ko TEXT,
  audio_url_en TEXT,
  UNIQUE(story_id, page_number)
);

-- 4. Subscriptions 테이블 (구독)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT CHECK (plan_type IN ('monthly', 'yearly')),
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  toss_billing_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Reading Progress 테이블 (읽기 진행률)
CREATE TABLE reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  current_page INTEGER DEFAULT 1,
  is_completed BOOLEAN DEFAULT false,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

-- =============================================
-- 인덱스
-- =============================================
CREATE INDEX idx_stories_category ON stories(category);
CREATE INDEX idx_stories_age_group ON stories(age_group);
CREATE INDEX idx_story_pages_story_id ON story_pages(story_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_reading_progress_user_id ON reading_progress(user_id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- Stories: 누구나 읽기 가능
CREATE POLICY "Stories are viewable by everyone" ON stories
  FOR SELECT USING (true);

-- Story Pages: 누구나 읽기 가능
CREATE POLICY "Story pages are viewable by everyone" ON story_pages
  FOR SELECT USING (true);

-- Users: 본인만 CRUD
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions: 본인만 조회
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Reading Progress: 본인만 CRUD
CREATE POLICY "Users can manage own progress" ON reading_progress
  FOR ALL USING (auth.uid() = user_id);
