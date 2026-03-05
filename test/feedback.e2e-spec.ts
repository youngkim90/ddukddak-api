import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/supabase/supabase.service';

const mockFeedbackRow = {
  id: 'fb-11111111-1111-1111-1111-111111111111',
  user_id: 'user-11111111-1111-1111-1111-111111111111',
  category: 'ux',
  rating: 4,
  message: '동화 뷰어가 너무 좋아요 계속 써요',
  source: 'viewer_complete',
  story_id: null,
  page_number: null,
  language: null,
  contact_email: null,
  metadata: {},
  status: 'received',
  created_at: '2026-03-04T10:00:00.000Z',
};

describe('POST /api/feedback (e2e)', () => {
  let app: INestApplication<App>;

  const validDto = {
    category: 'ux',
    rating: 4,
    message: '동화 뷰어가 너무 좋아요 계속 써요',
    source: 'viewer_complete',
  };

  function buildMockSupabase(feedbackResult: { data: unknown; error: unknown }) {
    return {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      single: jest.fn().mockResolvedValue(feedbackResult),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-11111111-1111-1111-1111-111111111111',
              email: 'test@example.com',
              aud: 'authenticated',
              role: 'authenticated',
              created_at: '2026-01-01T00:00:00.000Z',
              app_metadata: {},
              user_metadata: {},
            },
          },
          error: null,
        }),
      },
    };
  }

  async function createApp(feedbackResult: { data: unknown; error: unknown }) {
    const mockClient = buildMockSupabase(feedbackResult);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SupabaseService)
      .useValue({
        getClient: () => mockClient,
        getAdminClient: () => mockClient,
      })
      .compile();

    const nestApp = moduleFixture.createNestApplication();
    nestApp.setGlobalPrefix('api');
    nestApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await nestApp.init();
    return nestApp;
  }

  afterEach(async () => {
    if (app) await app.close();
  });

  it('should return 201 with valid payload and auth token', async () => {
    app = await createApp({ data: mockFeedbackRow, error: null });

    const response = await request(app.getHttpServer())
      .post('/api/feedback')
      .set('Authorization', 'Bearer mock-token')
      .send(validDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.category).toBe('ux');
    expect(response.body.rating).toBe(4);
    expect(response.body.status).toBe('received');
    expect(response.body).toHaveProperty('createdAt');
  });

  it('should return 401 without auth token', async () => {
    app = await createApp({ data: mockFeedbackRow, error: null });

    await request(app.getHttpServer()).post('/api/feedback').send(validDto).expect(401);
  });

  it('should return 400 when required field is missing', async () => {
    app = await createApp({ data: mockFeedbackRow, error: null });

    const { category: _category, ...withoutCategory } = validDto;
    await request(app.getHttpServer())
      .post('/api/feedback')
      .set('Authorization', 'Bearer mock-token')
      .send(withoutCategory)
      .expect(400);
  });

  it('should return 400 when rating is out of range', async () => {
    app = await createApp({ data: mockFeedbackRow, error: null });

    await request(app.getHttpServer())
      .post('/api/feedback')
      .set('Authorization', 'Bearer mock-token')
      .send({ ...validDto, rating: 6 })
      .expect(400);
  });

  it('should return 400 when message is too short', async () => {
    app = await createApp({ data: mockFeedbackRow, error: null });

    await request(app.getHttpServer())
      .post('/api/feedback')
      .set('Authorization', 'Bearer mock-token')
      .send({ ...validDto, message: '짧아요' })
      .expect(400);
  });

  it('should return 400 when category is invalid', async () => {
    app = await createApp({ data: mockFeedbackRow, error: null });

    await request(app.getHttpServer())
      .post('/api/feedback')
      .set('Authorization', 'Bearer mock-token')
      .send({ ...validDto, category: 'invalid_category' })
      .expect(400);
  });

  it('should return 400 when contactEmail format is invalid', async () => {
    app = await createApp({ data: mockFeedbackRow, error: null });

    await request(app.getHttpServer())
      .post('/api/feedback')
      .set('Authorization', 'Bearer mock-token')
      .send({ ...validDto, contactEmail: 'not-an-email' })
      .expect(400);
  });
});
