import { Controller, Get, Post, Delete, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser, Public } from '../common/decorators';
import { SubscriptionService } from './subscription.service';
import {
  SubscriptionPlansResponseDto,
  SubscriptionResponseDto,
  CreateSubscriptionDto,
} from './dto';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @Public()
  @ApiOperation({ summary: '구독 플랜 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '플랜 목록 조회 성공',
    type: SubscriptionPlansResponseDto,
  })
  getPlans(): SubscriptionPlansResponseDto {
    return this.subscriptionService.getPlans();
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 구독 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '구독 정보 조회 성공 (구독 없으면 subscription: null)',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getMySubscription(
    @CurrentUser() user: User,
  ): Promise<SubscriptionResponseDto | { subscription: null }> {
    const subscription = await this.subscriptionService.getMySubscription(user);

    if (!subscription) {
      return { subscription: null };
    }

    return subscription;
  }

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '구독 시작 (결제)' })
  @ApiResponse({
    status: 201,
    description: '구독 시작 성공',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 409, description: '이미 활성 구독 존재' })
  async createSubscription(
    @CurrentUser() user: User,
    @Body() dto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.createSubscription(user, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '구독 해지' })
  @ApiResponse({ status: 204, description: '구독 해지 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '구독 없음' })
  async cancelSubscription(@CurrentUser() user: User): Promise<void> {
    return this.subscriptionService.cancelSubscription(user);
  }
}
