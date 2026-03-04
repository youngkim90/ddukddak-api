-- feedbacks 테이블: 고객 피드백 수집 (F-505)
CREATE TABLE feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL CHECK (category IN ('bug', 'content', 'ux', 'performance', 'suggestion')),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message VARCHAR(500) NOT NULL CHECK (char_length(message) >= 10),
  source VARCHAR(30) NOT NULL CHECK (source IN ('viewer_complete', 'settings_customer_center')),
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  page_number INTEGER,
  language VARCHAR(5),
  contact_email VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX idx_feedbacks_created_at ON feedbacks(created_at DESC);
CREATE INDEX idx_feedbacks_category ON feedbacks(category);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own feedback" ON feedbacks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own feedback" ON feedbacks FOR SELECT USING (auth.uid() = user_id);
