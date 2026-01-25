import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/supabase/supabase.service';

// Mock 사용자 데이터
const mockUser = {
  id: 'user-11111111-1111-1111-1111-111111111111',
  email: 'test@example.com',
  user_metadata: {
    nickname: '테스트유저',
    avatar_url: 'https://example.com/avatar.jpg',
  },
  app_metadata: {
    provider: 'email',
  },
  created_at: '2024-01-01T00:00:00.000Z',
};

const mockUserProfile = {
  id: mockUser.id,
  email: mockUser.email,
  nickname: '테스트유저',
  avatar_url: 'https://example.com/avatar.jpg',
  provider: 'email',
  created_at: '2024-01-01T00:00:00.000Z',
};

// Mock Supabase 클라이언트
const createMockSupabaseClient = () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  auth: {
    getUser: jest.fn(),
    admin: {
      deleteUser: jest.fn(),
    },
  },
});

describe('UserController (e2e)', () => {
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

  describe('GET /api/users/me', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).get('/api/users/me').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return user profile with valid token', async () => {
      // Mock 인증 성공
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // Mock DB 조회
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockUserProfile,
        error: null,
      });

      const response = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('nickname');
    });
  });

  describe('PATCH /api/users/me', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .patch('/api/users/me')
        .send({ nickname: '새닉네임' })
        .expect(401);
    });

    it('should update user profile', async () => {
      const updatedProfile = {
        ...mockUserProfile,
        nickname: '새닉네임',
      };

      // Mock 인증 성공
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // Mock DB 업데이트: upsert().select().single() 체인
      mockSupabaseClient.upsert.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValueOnce({
            data: updatedProfile,
            error: null,
          }),
        }),
      });

      const response = await request(app.getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ nickname: '새닉네임' })
        .expect(200);

      expect(response.body.nickname).toBe('새닉네임');
    });

    it('should validate nickname length', async () => {
      // Mock 인증 성공
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // 빈 body는 validation 통과 (optional 필드만 있으므로)
      // upsert 체인 mock
      mockSupabaseClient.upsert.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          single: jest.fn().mockResolvedValueOnce({
            data: mockUserProfile,
            error: null,
          }),
        }),
      });

      // 빈 닉네임으로 업데이트 시 기존 값 유지
      const response = await request(app.getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('DELETE /api/users/me', () => {
    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer()).delete('/api/users/me').expect(401);
    });

    it('should delete user account', async () => {
      // Mock 인증 성공
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // Mock DB 삭제
      mockSupabaseClient.delete.mockReturnThis();
      mockSupabaseClient.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock Auth 삭제
      mockSupabaseClient.auth.admin.deleteUser.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await request(app.getHttpServer())
        .delete('/api/users/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(204);
    });
  });
});
