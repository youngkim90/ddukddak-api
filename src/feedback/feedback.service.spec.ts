import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { FeedbackService } from './feedback.service';
import { SupabaseService } from '../supabase/supabase.service';
import { FeedbackCategory, FeedbackSource } from './dto';

const mockUser: User = {
  id: 'user-11111111-1111-1111-1111-111111111111',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {},
} as User;

const mockFeedbackRow = {
  id: 'fb-11111111-1111-1111-1111-111111111111',
  user_id: mockUser.id,
  category: FeedbackCategory.UX,
  rating: 4,
  message: '동화 뷰어가 너무 좋아요 계속 써요',
  source: FeedbackSource.VIEWER_COMPLETE,
  story_id: null,
  page_number: null,
  language: null,
  contact_email: null,
  metadata: {},
  status: 'received',
  created_at: '2026-03-04T10:00:00.000Z',
};

function createChainableMock(finalValue: { data: unknown; error: unknown }) {
  return {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(finalValue),
  };
}

describe('FeedbackService', () => {
  let service: FeedbackService;

  async function createModule(chainableMock: ReturnType<typeof createChainableMock>) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: SupabaseService,
          useValue: { getAdminClient: () => chainableMock },
        },
      ],
    }).compile();

    return module.get<FeedbackService>(FeedbackService);
  }

  describe('create', () => {
    it('should return feedback response on success', async () => {
      const mock = createChainableMock({ data: mockFeedbackRow, error: null });
      service = await createModule(mock);

      const result = await service.create(mockUser, {
        category: FeedbackCategory.UX,
        rating: 4,
        message: '동화 뷰어가 너무 좋아요 계속 써요',
        source: FeedbackSource.VIEWER_COMPLETE,
      });

      expect(result.id).toBe(mockFeedbackRow.id);
      expect(result.category).toBe(FeedbackCategory.UX);
      expect(result.rating).toBe(4);
      expect(result.status).toBe('received');
      expect(result.createdAt).toBe(mockFeedbackRow.created_at);
    });

    it('should pass optional fields to insert', async () => {
      const mock = createChainableMock({ data: mockFeedbackRow, error: null });
      service = await createModule(mock);

      await service.create(mockUser, {
        category: FeedbackCategory.BUG,
        rating: 2,
        message: '페이지 넘길 때 오류가 발생해요 수정 부탁',
        source: FeedbackSource.SETTINGS_CUSTOMER_CENTER,
        storyId: 'story-11111111-1111-1111-1111-111111111111',
        pageNumber: 3,
        language: 'ko',
        contactEmail: 'user@example.com',
        metadata: { platform: 'ios', appVersion: '1.0.0' },
      });

      expect(mock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          story_id: 'story-11111111-1111-1111-1111-111111111111',
          page_number: 3,
          language: 'ko',
          contact_email: 'user@example.com',
          metadata: { platform: 'ios', appVersion: '1.0.0' },
        }),
      );
    });

    it('should throw InternalServerErrorException on db error', async () => {
      const mock = createChainableMock({ data: null, error: { message: 'db error' } });
      service = await createModule(mock);

      await expect(
        service.create(mockUser, {
          category: FeedbackCategory.SUGGESTION,
          rating: 5,
          message: '더 많은 동화를 추가해주세요 재미있어요',
          source: FeedbackSource.VIEWER_COMPLETE,
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should use null for undefined optional fields', async () => {
      const mock = createChainableMock({ data: mockFeedbackRow, error: null });
      service = await createModule(mock);

      await service.create(mockUser, {
        category: FeedbackCategory.CONTENT,
        rating: 3,
        message: '내용이 조금 더 다양했으면 좋겠어요 기대',
        source: FeedbackSource.SETTINGS_CUSTOMER_CENTER,
      });

      expect(mock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          story_id: null,
          page_number: null,
          language: null,
          contact_email: null,
          metadata: {},
        }),
      );
    });
  });
});
