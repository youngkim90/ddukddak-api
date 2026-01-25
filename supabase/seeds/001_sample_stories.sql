-- =============================================
-- 샘플 동화 데이터
-- Created: 2026-01-25
-- =============================================

-- 테스트 동화 데이터 삽입
INSERT INTO stories (title_ko, title_en, description_ko, description_en, category, age_group, thumbnail_url, is_free, page_count, duration_minutes) VALUES
('아기돼지 삼형제', 'Three Little Pigs', '세 마리 돼지의 지혜 이야기', 'A story of three wise pigs', 'lesson', '3-5', 'https://picsum.photos/seed/pig/400/300', true, 12, 10),
('빨간 모자', 'Little Red Riding Hood', '숲속 할머니 집으로 가는 여정', 'A journey to grandmother''s house', 'adventure', '5-7', 'https://picsum.photos/seed/red/400/300', true, 15, 12),
('신데렐라', 'Cinderella', '꿈을 이루는 마법 이야기', 'A magical story of dreams coming true', 'emotion', '5-7', 'https://picsum.photos/seed/cinderella/400/300', false, 20, 15),
('잭과 콩나무', 'Jack and the Beanstalk', '하늘 위 거인의 성 모험', 'Adventure to the giant''s castle in the sky', 'adventure', '7+', 'https://picsum.photos/seed/jack/400/300', false, 18, 14);

-- 첫 번째 동화(아기돼지 삼형제)의 샘플 페이지
INSERT INTO story_pages (story_id, page_number, text_ko, text_en, image_url)
SELECT id, 1, '옛날 옛적에 아기돼지 삼형제가 살았어요.', 'Once upon a time, there were three little pigs.', 'https://picsum.photos/seed/pig1/800/600'
FROM stories WHERE title_ko = '아기돼지 삼형제';

INSERT INTO story_pages (story_id, page_number, text_ko, text_en, image_url)
SELECT id, 2, '첫째 돼지는 짚으로 집을 지었어요.', 'The first pig built a house of straw.', 'https://picsum.photos/seed/pig2/800/600'
FROM stories WHERE title_ko = '아기돼지 삼형제';

INSERT INTO story_pages (story_id, page_number, text_ko, text_en, image_url)
SELECT id, 3, '둘째 돼지는 나무로 집을 지었어요.', 'The second pig built a house of wood.', 'https://picsum.photos/seed/pig3/800/600'
FROM stories WHERE title_ko = '아기돼지 삼형제';
