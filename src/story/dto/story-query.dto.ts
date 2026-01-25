import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class StoryQueryDto {
  @ApiProperty({
    description: '카테고리 필터',
    enum: ['adventure', 'lesson', 'emotion', 'creativity'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['adventure', 'lesson', 'emotion', 'creativity'])
  category?: 'adventure' | 'lesson' | 'emotion' | 'creativity';

  @ApiProperty({
    description: '연령대 필터',
    enum: ['3-5', '5-7', '7+'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['3-5', '5-7', '7+'])
  ageGroup?: '3-5' | '5-7' | '7+';

  @ApiProperty({
    description: '페이지 번호',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: '페이지당 개수',
    required: false,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
