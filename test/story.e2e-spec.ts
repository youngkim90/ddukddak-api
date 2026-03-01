import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/supabase/supabase.service';

// Mock 데이터
const mockStories = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title_ko: '아기돼지 삼형제',
    title_en: 'Three Little Pigs',
    description_ko: '세 마리 돼지의 지혜 이야기',
    description_en: 'A story of three wise pigs',
    thumbnail_url: 'https://example.com/pig.jpg',
    category: 'lesson',
    age_group: '3-5',
    duration_minutes: 10,
    page_count: 12,
    is_free: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title_ko: '빨간 모자',
    title_en: 'Little Red Riding Hood',
    description_ko: '숲속 할머니 집으로 가는 여정',
    description_en: 'A journey to grandmother house',
    thumbnail_url: 'https://example.com/red.jpg',
    category: 'adventure',
    age_group: '5-7',
    duration_minutes: 12,
    page_count: 15,
    is_free: false,
  },
];

// 페이지 mock 데이터
const mockPageWithoutSentences = {
  id: 'page-1',
  story_id: '11111111-1111-1111-1111-111111111111',
  page_number: 1,
  media_type: 'image',
  image_url: 'https://example.com/page1.jpg',
  video_url: null,
  text_ko: '옛날 옛적에 아기돼지 삼형제가 살았어요.',
  text_en: 'Once upon a time, there were three little pigs.',
  audio_url_ko: 'https://example.com/audio1_ko.mp3',
  audio_url_en: 'https://example.com/audio1_en.mp3',
  story_page_sentences: [],
};

const mockPageWithSentences = {
  ...mockPageWithoutSentences,
  id: 'page-2',
  page_number: 2,
  story_page_sentences: [
    {
      id: 'sentence-2',
      page_id: 'page-2',
      sentence_index: 1,
      text_ko: '두 번째 문장이에요.',
      text_en: 'This is the second sentence.',
      audio_url_ko: null,
      audio_url_en: null,
    },
    {
      id: 'sentence-1',
      page_id: 'page-2',
      sentence_index: 0,
      text_ko: '첫 번째 문장이에요.',
      text_en: 'This is the first sentence.',
      audio_url_ko: 'https://example.com/s1_ko.mp3',
      audio_url_en: null,
    },
  ],
};

// Mock Supabase 클라이언트
const createMockSupabaseClient = () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  auth: {
    getUser: jest.fn(),
  },
});

describe('StoryController (e2e)', () => {
  let app: INestApplication<App>;
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;

  beforeAll(async () => {
    mockSupabaseClient = createMockSupabaseClient();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue({
        getClient: () => mockSupabaseClient,
        getAdminClient: () => mockSupabaseClient,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/stories', () => {
    it('should return paginated stories list', async () => {
      // Mock 설정
      mockSupabaseClient.range.mockResolvedValueOnce({
        data: mockStories,
        error: null,
        count: 2,
      });

      const response = await request(app.getHttpServer()).get('/api/stories').expect(200);

      expect(response.body).toHaveProperty('stories');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.stories)).toBe(true);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.page).toBe(1);
    });

    it('should filter stories by category', async () => {
      const adventureStories = mockStories.filter((s) => s.category === 'adventure');
      mockSupabaseClient.range.mockResolvedValueOnce({
        data: adventureStories,
        error: null,
        count: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/api/stories?category=adventure')
        .expect(200);

      expect(response.body.stories.length).toBe(1);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('category', 'adventure');
    });

    it('should filter stories by age group', async () => {
      const filteredStories = mockStories.filter((s) => s.age_group === '5-7');
      mockSupabaseClient.range.mockResolvedValueOnce({
        data: filteredStories,
        error: null,
        count: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/api/stories?ageGroup=5-7')
        .expect(200);

      expect(response.body.stories.length).toBe(1);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('age_group', '5-7');
    });

    it('should return 400 for invalid category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/stories?category=invalid')
        .expect(400);

      expect(response.body.message[0]).toContain('category');
    });

    it('should return 400 for invalid age group', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/stories?ageGroup=invalid')
        .expect(400);

      expect(response.body.message[0]).toContain('ageGroup');
    });

    it('should apply pagination correctly', async () => {
      mockSupabaseClient.range.mockResolvedValueOnce({
        data: [mockStories[0]],
        error: null,
        count: 2,
      });

      const response = await request(app.getHttpServer())
        .get('/api/stories?page=1&limit=1')
        .expect(200);

      expect(response.body.stories.length).toBe(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(response.body.pagination.hasNext).toBe(true);
      expect(response.body.pagination.hasPrev).toBe(false);
    });
  });

  describe('GET /api/stories/:id', () => {
    it('should return story detail', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockStories[0],
        error: null,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/stories/${mockStories[0].id}`)
        .expect(200);

      expect(response.body.id).toBe(mockStories[0].id);
      expect(response.body.titleKo).toBe(mockStories[0].title_ko);
    });

    it('should return 404 for non-existent story', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });

      const response = await request(app.getHttpServer())
        .get('/api/stories/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer()).get('/api/stories/invalid-uuid').expect(400);
    });
  });

  describe('GET /api/stories/:id/pages', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get(`/api/stories/${mockStories[0].id}/pages`).expect(401);
    });

    it('should return 401 with invalid token', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      await request(app.getHttpServer())
        .get(`/api/stories/${mockStories[0].id}/pages`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return pages with empty sentences array when no sentences exist', async () => {
      // auth.getUser → 유효한 사용자 반환
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123', email: 'test@test.com' } },
        error: null,
      });
      // story 존재 확인 (single)
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: mockStories[0].id },
        error: null,
      });
      // story_pages + story_page_sentences 조회 (order)
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: [mockPageWithoutSentences],
        error: null,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/stories/${mockStories[0].id}/pages`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('pages');
      expect(Array.isArray(response.body.pages)).toBe(true);
      expect(response.body.pages[0]).toHaveProperty('sentences');
      expect(Array.isArray(response.body.pages[0].sentences)).toBe(true);
      expect(response.body.pages[0].sentences).toHaveLength(0);
    });

    it('should return pages with sentences sorted by sentenceIndex', async () => {
      // auth.getUser → 유효한 사용자 반환
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123', email: 'test@test.com' } },
        error: null,
      });
      // story 존재 확인 (single)
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: mockStories[0].id },
        error: null,
      });
      // story_pages + story_page_sentences 조회 (order)
      // mockPageWithSentences에는 sentence_index 순서가 뒤집혀 있음 (1, 0 순서로 저장)
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: [mockPageWithSentences],
        error: null,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/stories/${mockStories[0].id}/pages`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      const page = response.body.pages[0];
      expect(page.sentences).toHaveLength(2);
      // sentenceIndex 오름차순 정렬 검증
      expect(page.sentences[0].sentenceIndex).toBe(0);
      expect(page.sentences[1].sentenceIndex).toBe(1);
      expect(page.sentences[0].textKo).toBe('첫 번째 문장이에요.');
      expect(page.sentences[0].audioUrlKo).toBe('https://example.com/s1_ko.mp3');
    });
  });
});
