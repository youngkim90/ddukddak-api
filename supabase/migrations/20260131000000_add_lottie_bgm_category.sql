-- =============================================
-- 002: Lottie URL, BGM URL 추가 + 카테고리 변경
-- Created: 2026-01-31
-- Description:
--   1. story_pages에 lottie_url 컬럼 추가
--   2. stories에 bgm_url 컬럼 추가
--   3. stories.category CHECK 제약조건 제거 (UPDATE 전 필수)
--   4. stories.category: 'emotion' → 'family' 마이그레이션
--   5. stories.category CHECK 제약조건 재정의
-- =============================================

-- 1. story_pages에 Lottie URL 컬럼 추가 (멱등)
ALTER TABLE story_pages ADD COLUMN IF NOT EXISTS lottie_url TEXT;

-- 2. stories에 BGM URL 컬럼 추가 (멱등)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS bgm_url TEXT;

-- 3. 기존 CHECK 제약조건 제거 (UPDATE 전에 제거해야 'family' 값 허용)
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_category_check;

-- 4. 기존 'emotion' 카테고리 데이터를 'family'로 마이그레이션
UPDATE stories SET category = 'family' WHERE category = 'emotion';

-- 5. 새 CHECK 제약조건 추가 (emotion 제거, family + folktale 추가)
ALTER TABLE stories ADD CONSTRAINT stories_category_check
  CHECK (category IN ('adventure', 'lesson', 'family', 'creativity', 'folktale'));
