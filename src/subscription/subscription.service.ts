import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { TossService } from './toss.service';
import {
  SubscriptionResponseDto,
  SubscriptionPlansResponseDto,
  CreateSubscriptionDto,
} from './dto';

// 구독 플랜 정의 (하드코딩 - 추후 DB로 이동 가능)
const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'monthly',
    name: '월간 구독',
    price: 4900,
    period: 'monthly' as const,
    features: ['모든 동화 무제한', '오프라인 저장'],
    durationDays: 30,
  },
  yearly: {
    id: 'yearly',
    name: '연간 구독',
    price: 39000,
    period: 'yearly' as const,
    features: ['모든 동화 무제한', '오프라인 저장', '2개월 무료'],
    durationDays: 365,
  },
};

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly tossService: TossService,
  ) {}

  /**
   * 구독 플랜 목록 조회
   */
  getPlans(): SubscriptionPlansResponseDto {
    return {
      plans: Object.values(SUBSCRIPTION_PLANS).map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        period: plan.period,
        features: plan.features,
      })),
    };
  }

  /**
   * 내 구독 정보 조회
   */
  async getMySubscription(user: User): Promise<SubscriptionResponseDto | null> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapToResponse(data);
  }

  /**
   * 구독 시작 (결제)
   */
  async createSubscription(
    user: User,
    dto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    // 1. 기존 활성 구독 확인
    const existingSubscription = await this.getMySubscription(user);
    if (existingSubscription && existingSubscription.status === 'active') {
      throw new ConflictException('Already has an active subscription');
    }

    // 2. 플랜 정보 가져오기
    const plan = SUBSCRIPTION_PLANS[dto.planType];
    if (!plan) {
      throw new NotFoundException(`Plan ${dto.planType} not found`);
    }

    // 3. 토스페이먼츠 빌링 실행
    const orderId = `sub_${user.id}_${Date.now()}`;
    const orderName = `뚝딱동화 ${plan.name}`;

    await this.tossService.requestBilling(dto.billingKey, user.id, plan.price, orderId, orderName);

    // 4. 구독 정보 저장
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_type: dto.planType,
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: true,
        toss_billing_key: dto.billingKey,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to create subscription: ${error?.message}`);
    }

    return this.mapToResponse(data);
  }

  /**
   * 구독 해지 (자동 갱신 중지)
   */
  async cancelSubscription(user: User): Promise<void> {
    const subscription = await this.getMySubscription(user);

    if (!subscription) {
      throw new NotFoundException('No subscription found');
    }

    if (subscription.status !== 'active') {
      throw new ConflictException('Subscription is not active');
    }

    const { error } = await this.supabaseService
      .getAdminClient()
      .from('subscriptions')
      .update({
        status: 'cancelled',
        auto_renew: false,
      })
      .eq('id', subscription.id);

    if (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * 구독 갱신 (웹훅에서 호출)
   */
  async renewSubscription(userId: string): Promise<void> {
    const { data: subscription, error: fetchError } = await this.supabaseService
      .getAdminClient()
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('auto_renew', true)
      .single();

    if (fetchError || !subscription) {
      return; // 갱신할 구독 없음
    }

    const plan = SUBSCRIPTION_PLANS[subscription.plan_type as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan) return;

    // 빌링 실행
    const orderId = `renew_${userId}_${Date.now()}`;
    const orderName = `뚝딱동화 ${plan.name} 갱신`;

    try {
      await this.tossService.requestBilling(
        subscription.toss_billing_key as string,
        userId,
        plan.price,
        orderId,
        orderName,
      );

      // 만료일 연장
      const newExpiresAt = new Date(subscription.expires_at as string);
      newExpiresAt.setDate(newExpiresAt.getDate() + plan.durationDays);

      await this.supabaseService
        .getAdminClient()
        .from('subscriptions')
        .update({
          expires_at: newExpiresAt.toISOString(),
        })
        .eq('id', subscription.id);
    } catch {
      // 결제 실패 시 구독 만료 처리
      await this.supabaseService
        .getAdminClient()
        .from('subscriptions')
        .update({
          status: 'expired',
          auto_renew: false,
        })
        .eq('id', subscription.id);
    }
  }

  private mapToResponse(data: Record<string, unknown>): SubscriptionResponseDto {
    return {
      id: data.id as string,
      planType: data.plan_type as 'monthly' | 'yearly',
      status: data.status as 'active' | 'cancelled' | 'expired',
      startedAt: data.started_at as string,
      expiresAt: data.expires_at as string,
      autoRenew: data.auto_renew as boolean,
    };
  }
}
