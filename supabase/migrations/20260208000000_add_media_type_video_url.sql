-- =============================================
-- 003: media_type, video_url 추가 / lottie_url 제거
-- Created: 2026-02-08
-- Description:
--   1. story_pages에 media_type 컬럼 추가 (image/video)
--   2. story_pages에 video_url 컬럼 추가
--   3. story_pages에서 lottie_url 컬럼 제거
-- =============================================

-- 1. story_pages에 media_type 추가
ALTER TABLE story_pages ADD COLUMN media_type TEXT NOT NULL DEFAULT 'image';
ALTER TABLE story_pages ADD CONSTRAINT story_pages_media_type_check
  CHECK (media_type IN ('image', 'video'));

-- 2. story_pages에 video_url 추가
ALTER TABLE story_pages ADD COLUMN video_url TEXT;

-- 3. lottie_url 제거 (사용하지 않음)
ALTER TABLE story_pages DROP COLUMN IF EXISTS lottie_url;
