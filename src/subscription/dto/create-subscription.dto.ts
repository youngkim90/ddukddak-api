import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: '구독 플랜 타입',
    enum: ['monthly', 'yearly'],
    example: 'monthly',
  })
  @IsEnum(['monthly', 'yearly'])
  planType!: 'monthly' | 'yearly';

  @ApiProperty({
    description: '토스페이먼츠 빌링키',
    example: 'billing_key_xxx',
  })
  @IsString()
  billingKey!: string;
}
