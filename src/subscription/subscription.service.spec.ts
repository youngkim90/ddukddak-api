import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { SubscriptionService } from './subscription.service';
import { SupabaseService } from '../supabase/supabase.service';
import { TossService } from './toss.service';

// Mock 데이터
const mockUser: User = {
  id: 'user-11111111-1111-1111-1111-111111111111',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {},
} as User;

const mockSubscription = {
  id: 'sub-11111111-1111-1111-1111-111111111111',
  user_id: mockUser.id,
  plan_type: 'monthly',
  status: 'active',
  started_at: '2024-01-01T00:00:00.000Z',
  expires_at: '2024-02-01T00:00:00.000Z',
  auto_renew: true,
  toss_billing_key: 'billing_key_123',
};

// Supabase 체이닝을 위한 헬퍼 함수
function createChainableMock(finalValue: { data: unknown; error: unknown }) {
  const mock = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(finalValue),
  };
  return mock;
}

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let mockTossService: { requestBilling: jest.Mock };

  describe('getPlans', () => {
    beforeEach(async () => {
      const chainableMock = createChainableMock({ data: null, error: null });
      mockTossService = { requestBilling: jest.fn() };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SubscriptionService,
          {
            provide: SupabaseService,
            useValue: { getAdminClient: () => chainableMock },
          },
          { provide: TossService, useValue: mockTossService },
        ],
      }).compile();

      service = module.get<SubscriptionService>(SubscriptionService);
    });

    it('should return subscription plans', () => {
      const result = service.getPlans();

      expect(result.plans).toHaveLength(2);
      expect(result.plans[0]).toHaveProperty('id');
      expect(result.plans[0]).toHaveProperty('name');
      expect(result.plans[0]).toHaveProperty('price');
      expect(result.plans[0]).toHaveProperty('period');
      expect(result.plans[0]).toHaveProperty('features');
    });

    it('should include monthly and yearly plans', () => {
      const result = service.getPlans();
      const planIds = result.plans.map((p) => p.id);

      expect(planIds).toContain('monthly');
      expect(planIds).toContain('yearly');
    });
  });

  describe('getMySubscription', () => {
    it('should return subscription if exists', async () => {
      const chainableMock = createChainableMock({
        data: mockSubscription,
        error: null,
      });
      mockTossService = { requestBilling: jest.fn() };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SubscriptionService,
          {
            provide: SupabaseService,
            useValue: { getAdminClient: () => chainableMock },
          },
          { provide: TossService, useValue: mockTossService },
        ],
      }).compile();

      service = module.get<SubscriptionService>(SubscriptionService);
      const result = await service.getMySubscription(mockUser);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockSubscription.id);
      expect(result?.planType).toBe('monthly');
      expect(result?.status).toBe('active');
    });

    it('should return null if no subscription exists', async () => {
      const chainableMock = createChainableMock({
        data: null,
        error: { code: 'PGRST116' },
      });
      mockTossService = { requestBilling: jest.fn() };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SubscriptionService,
          {
            provide: SupabaseService,
            useValue: { getAdminClient: () => chainableMock },
          },
          { provide: TossService, useValue: mockTossService },
        ],
      }).compile();

      service = module.get<SubscriptionService>(SubscriptionService);
      const result = await service.getMySubscription(mockUser);

      expect(result).toBeNull();
    });
  });

  describe('createSubscription', () => {
    it('should throw ConflictException if already has active subscription', async () => {
      const chainableMock = createChainableMock({
        data: mockSubscription,
        error: null,
      });
      mockTossService = { requestBilling: jest.fn() };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SubscriptionService,
          {
            provide: SupabaseService,
            useValue: { getAdminClient: () => chainableMock },
          },
          { provide: TossService, useValue: mockTossService },
        ],
      }).compile();

      service = module.get<SubscriptionService>(SubscriptionService);

      await expect(
        service.createSubscription(mockUser, {
          planType: 'monthly',
          billingKey: 'new_billing_key',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException for invalid plan', async () => {
      const chainableMock = createChainableMock({
        data: null,
        error: { code: 'PGRST116' },
      });
      mockTossService = { requestBilling: jest.fn() };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SubscriptionService,
          {
            provide: SupabaseService,
            useValue: { getAdminClient: () => chainableMock },
          },
          { provide: TossService, useValue: mockTossService },
        ],
      }).compile();

      service = module.get<SubscriptionService>(SubscriptionService);

      await expect(
        service.createSubscription(mockUser, {
          planType: 'invalid' as 'monthly' | 'yearly',
          billingKey: 'billing_key',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelSubscription', () => {
    it('should throw NotFoundException if no subscription exists', async () => {
      const chainableMock = createChainableMock({
        data: null,
        error: { code: 'PGRST116' },
      });
      mockTossService = { requestBilling: jest.fn() };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SubscriptionService,
          {
            provide: SupabaseService,
            useValue: { getAdminClient: () => chainableMock },
          },
          { provide: TossService, useValue: mockTossService },
        ],
      }).compile();

      service = module.get<SubscriptionService>(SubscriptionService);

      await expect(service.cancelSubscription(mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if subscription is not active', async () => {
      const chainableMock = createChainableMock({
        data: { ...mockSubscription, status: 'cancelled' },
        error: null,
      });
      mockTossService = { requestBilling: jest.fn() };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SubscriptionService,
          {
            provide: SupabaseService,
            useValue: { getAdminClient: () => chainableMock },
          },
          { provide: TossService, useValue: mockTossService },
        ],
      }).compile();

      service = module.get<SubscriptionService>(SubscriptionService);

      await expect(service.cancelSubscription(mockUser)).rejects.toThrow(ConflictException);
    });
  });
});
