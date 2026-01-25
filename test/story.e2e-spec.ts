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

// 향후 페이지 테스트에서 사용할 수 있도록 보관
const _mockPages = [
  {
    id: 'page-1',
    story_id: '11111111-1111-1111-1111-111111111111',
    page_number: 1,
    image_url: 'https://example.com/page1.jpg',
    text_ko: '옛날 옛적에 아기돼지 삼형제가 살았어요.',
    text_en: 'Once upon a time, there were three little pigs.',
    audio_url_ko: 'https://example.com/audio1_ko.mp3',
    audio_url_en: 'https://example.com/audio1_en.mp3',
  },
];
void _mockPages; // suppress unused variable warning

// Mock Supabase 클라이언트
const createMockSupabaseClient = () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
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
  });
});
