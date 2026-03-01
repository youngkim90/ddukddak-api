-- story_page_sentences RLS 활성화 및 정책 추가
-- (20260224000000에서 누락된 항목 보완)

ALTER TABLE story_page_sentences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Story page sentences are viewable by everyone"
  ON story_page_sentences FOR SELECT USING (true);
