import {
  IsEnum,
  IsInt,
  IsString,
  IsOptional,
  IsEmail,
  IsUUID,
  IsObject,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FeedbackCategory {
  BUG = 'bug',
  CONTENT = 'content',
  UX = 'ux',
  PERFORMANCE = 'performance',
  SUGGESTION = 'suggestion',
}

export enum FeedbackSource {
  VIEWER_COMPLETE = 'viewer_complete',
  SETTINGS_CUSTOMER_CENTER = 'settings_customer_center',
}

export class CreateFeedbackDto {
  @ApiProperty({ enum: FeedbackCategory, description: '피드백 카테고리' })
  @IsEnum(FeedbackCategory)
  category!: FeedbackCategory;

  @ApiProperty({ minimum: 1, maximum: 5, description: '평점 (1~5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ minLength: 10, maxLength: 500, description: '피드백 메시지' })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  message!: string;

  @ApiProperty({ enum: FeedbackSource, description: '피드백 출처' })
  @IsEnum(FeedbackSource)
  source!: FeedbackSource;

  @ApiPropertyOptional({ description: '관련 동화 ID (UUID)' })
  @IsOptional()
  @IsUUID()
  storyId?: string;

  @ApiPropertyOptional({ description: '페이지 번호' })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageNumber?: number;

  @ApiPropertyOptional({ enum: ['ko', 'en'], description: '언어' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: '연락 이메일' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ description: '추가 메타데이터 (platform, appVersion 등)' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
