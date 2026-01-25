import { ApiProperty } from '@nestjs/swagger';

export class ProgressResponseDto {
  @ApiProperty({ description: '동화 ID (UUID)' })
  storyId!: string;

  @ApiProperty({ description: '동화 제목' })
  storyTitle!: string;

  @ApiProperty({ description: '현재 페이지' })
  currentPage!: number;

  @ApiProperty({ description: '전체 페이지 수' })
  totalPages!: number;

  @ApiProperty({ description: '완료 여부' })
  isCompleted!: boolean;

  @ApiProperty({ description: '마지막 읽은 시간' })
  lastReadAt!: string;
}

export class ProgressListResponseDto {
  @ApiProperty({ description: '진행률 목록', type: [ProgressResponseDto] })
  data!: ProgressResponseDto[];
}
