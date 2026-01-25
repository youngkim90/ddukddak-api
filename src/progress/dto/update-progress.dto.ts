import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({ description: '현재 페이지', example: 5 })
  @IsInt()
  @Min(1)
  currentPage!: number;

  @ApiProperty({ description: '완료 여부', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean = false;
}
