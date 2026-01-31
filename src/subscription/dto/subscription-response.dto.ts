import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionPlanDto {
  @ApiProperty({ description: '플랜 ID', example: 'free' })
  id!: string;

  @ApiProperty({ description: '플랜 이름', example: '무료' })
  name!: string;

  @ApiProperty({ description: '가격 (원)', example: 0 })
  price!: number;

  @ApiProperty({
    description: '결제 주기',
    enum: ['month', 'year'],
    nullable: true,
    example: null,
  })
  period!: 'month' | 'year' | null;

  @ApiProperty({
    description: '포함 기능',
    example: ['동화 5편 이용'],
  })
  features!: string[];
}

export class SubscriptionPlansResponseDto {
  @ApiProperty({ description: '구독 플랜 목록', type: [SubscriptionPlanDto] })
  plans!: SubscriptionPlanDto[];
}

export class SubscriptionResponseDto {
  @ApiProperty({ description: '구독 ID (UUID)' })
  id!: string;

  @ApiProperty({ description: '플랜 타입', enum: ['monthly', 'yearly'] })
  planType!: 'monthly' | 'yearly';

  @ApiProperty({
    description: '구독 상태',
    enum: ['active', 'cancelled', 'expired'],
  })
  status!: 'active' | 'cancelled' | 'expired';

  @ApiProperty({ description: '구독 시작일' })
  startedAt!: string;

  @ApiProperty({ description: '구독 만료일' })
  expiresAt!: string;

  @ApiProperty({ description: '자동 갱신 여부' })
  autoRenew!: boolean;
}
