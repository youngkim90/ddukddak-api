import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { User } from '@supabase/supabase-js';
import { SupabaseService } from '../../supabase/supabase.service';

export const REQUIRE_SUBSCRIPTION_KEY = 'requireSubscription';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireSubscription = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If @RequireSubscription() is not applied, allow access
    if (!requireSubscription) {
      return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = request.user as User | undefined;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check for active subscription
    const hasActiveSubscription = await this.checkSubscription(user.id);

    if (!hasActiveSubscription) {
      // Check if the content is free (for story pages)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const storyId = request.params?.id as string | undefined;
      if (storyId) {
        const isFreeContent = await this.checkFreeContent(storyId);
        if (isFreeContent) {
          return true;
        }
      }

      throw new ForbiddenException('Active subscription required to access this content');
    }

    return true;
  }

  private async checkSubscription(userId: string): Promise<boolean> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('subscriptions')
      .select('status, expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return false;
    }

    // Check if subscription is not expired
    const expiresAt = new Date(data.expires_at as string);
    return expiresAt > new Date();
  }

  private async checkFreeContent(storyId: string): Promise<boolean> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('stories')
      .select('is_free')
      .eq('id', storyId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.is_free as boolean;
  }
}
