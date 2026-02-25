-- 문장 단위 TTS 지원을 위한 story_page_sentences 테이블 신설
-- story_pages의 page-level 오디오는 하위 호환을 위해 유지 (Phase 2에서 제거 예정)

CREATE TABLE story_page_sentences (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id        uuid        NOT NULL REFERENCES story_pages(id) ON DELETE CASCADE,
  sentence_index int         NOT NULL,
  text_ko        text,
  text_en        text,
  audio_url_ko   text,
  audio_url_en   text,
  UNIQUE (page_id, sentence_index)
);

-- 페이지별 문장 조회 성능 최적화 인덱스
CREATE INDEX idx_story_page_sentences_page_id ON story_page_sentences(page_id);

-- RLS: story_pages와 동일하게 누구나 읽기 가능, 쓰기는 차단
ALTER TABLE story_page_sentences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story page sentences are viewable by everyone"
  ON story_page_sentences FOR SELECT USING (true);
