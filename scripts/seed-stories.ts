/**
 * 동화 콘텐츠 시드 스크립트
 *
 * 사용법: pnpm run seed
 *
 * ddukddak-story/delivery/stories.json 파일을 읽어 DB에 일괄 등록합니다.
 * - 기존 데이터는 TRUNCATE 후 재등록
 * - R2 업로드는 별도 처리 (이 스크립트는 DB INSERT만 담당)
 * - page_count, duration_minutes는 pages 배열에서 자동 계산
 */

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

dotenv.config();

interface StoryPageInput {
  page_number: number;
  text_ko: string;
  text_en: string;
  media_type: 'image' | 'video';
  image_url: string;
  video_url: string | null;
  audio_url_ko: string;
  audio_url_en: string;
}

interface StoryInput {
  title_ko: string;
  title_en: string;
  description_ko: string;
  description_en: string;
  category: 'folktale' | 'lesson' | 'family' | 'adventure' | 'creativity';
  age_group: '3-5' | '5-7' | '7+';
  is_free: boolean;
  thumbnail_url: string;
  bgm_url?: string;
  pages: StoryPageInput[];
}

async function main() {
  // 1. 환경 변수 확인
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
  }

  // 2. Supabase Admin 클라이언트 생성
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 3. JSON 파일 읽기 (ddukddak-story/delivery/stories.json)
  const dataPath = path.resolve(__dirname, '..', '..', 'ddukddak-story', 'delivery', 'stories.json');

  if (!fs.existsSync(dataPath)) {
    console.error(`ERROR: ${dataPath} not found.`);
    console.error('캉테가 ddukddak-story/delivery/stories.json에 콘텐츠를 준비해야 합니다.');
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8') as string;
  const stories: StoryInput[] = JSON.parse(rawData) as StoryInput[];

  console.log(`\n📚 동화 ${stories.length}편 시드 시작...\n`);

  // 4. 기존 데이터 TRUNCATE (story_pages → stories 순서)
  console.log('🗑️  기존 데이터 삭제 중...');

  const { error: truncatePagesError } = await supabase
    .from('story_pages')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // 전체 삭제
  if (truncatePagesError) {
    console.error('story_pages 삭제 실패:', truncatePagesError.message);
    process.exit(1);
  }

  const { error: truncateStoriesError } = await supabase
    .from('stories')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // 전체 삭제
  if (truncateStoriesError) {
    console.error('stories 삭제 실패:', truncateStoriesError.message);
    process.exit(1);
  }

  console.log('✅ 기존 데이터 삭제 완료\n');

  // 5. 동화 INSERT
  for (let i = 0; i < stories.length; i++) {
    const story = stories[i]!;
    const pageCount = story.pages.length;
    const durationMinutes = Math.ceil(pageCount * 0.5);

    console.log(`📖 [${i + 1}/${stories.length}] "${story.title_ko}" (${pageCount}페이지)...`);

    // stories 테이블 INSERT
    const { data: insertedStory, error: storyError } = await supabase
      .from('stories')
      .insert({
        title_ko: story.title_ko,
        title_en: story.title_en,
        description_ko: story.description_ko,
        description_en: story.description_en,
        category: story.category,
        age_group: story.age_group,
        is_free: story.is_free,
        thumbnail_url: story.thumbnail_url,
        bgm_url: story.bgm_url ?? null,
        page_count: pageCount,
        duration_minutes: durationMinutes,
      })
      .select('id')
      .single();

    if (storyError || !insertedStory) {
      console.error(`  ❌ 동화 INSERT 실패:`, storyError?.message);
      continue;
    }

    const storyId = (insertedStory as { id: string }).id;

    // story_pages 테이블 INSERT (일괄)
    const pageRows = story.pages.map((page) => ({
      story_id: storyId,
      page_number: page.page_number,
      text_ko: page.text_ko,
      text_en: page.text_en,
      media_type: page.media_type ?? 'image',
      image_url: page.image_url,
      video_url: page.video_url ?? null,
      audio_url_ko: page.audio_url_ko,
      audio_url_en: page.audio_url_en,
    }));

    const { error: pagesError } = await supabase.from('story_pages').insert(pageRows);

    if (pagesError) {
      console.error(`  ❌ 페이지 INSERT 실패:`, pagesError.message);
      continue;
    }

    console.log(`  ✅ 완료 (ID: ${storyId})`);
  }

  console.log(`\n🎉 시드 완료! 총 ${stories.length}편 등록됨\n`);
}

main().catch((err) => {
  console.error('시드 스크립트 실행 중 오류:', err);
  process.exit(1);
});
