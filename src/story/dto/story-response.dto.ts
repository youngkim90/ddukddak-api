import { ApiProperty } from '@nestjs/swagger';

export class StoryResponseDto {
  @ApiProperty({ description: '동화 ID (UUID)' })
  id!: string;

  @ApiProperty({ description: '제목 (한국어)' })
  title!: string;

  @ApiProperty({ description: '제목 (영어)' })
  titleEn!: string;

  @ApiProperty({ description: '설명 (한국어)' })
  description!: string;

  @ApiProperty({ description: '설명 (영어)' })
  descriptionEn!: string;

  @ApiProperty({ description: '썸네일 URL' })
  thumbnailUrl!: string;

  @ApiProperty({
    description: '카테고리',
    enum: ['adventure', 'lesson', 'emotion', 'creativity'],
  })
  category!: 'adventure' | 'lesson' | 'emotion' | 'creativity';

  @ApiProperty({ description: '연령대', enum: ['3-5', '5-7', '7+'] })
  ageGroup!: '3-5' | '5-7' | '7+';

  @ApiProperty({ description: '재생 시간 (분)' })
  duration!: number;

  @ApiProperty({ description: '페이지 수' })
  pageCount!: number;

  @ApiProperty({ description: '잠금 여부 (구독 필요 콘텐츠)' })
  isLocked!: boolean;

  @ApiProperty({ description: '생성일', required: false })
  createdAt?: string;
}

export class StoryPageDto {
  @ApiProperty({ description: '페이지 ID (UUID)' })
  id!: string;

  @ApiProperty({ description: '페이지 번호' })
  pageNumber!: number;

  @ApiProperty({ description: '이미지 URL' })
  imageUrl!: string;

  @ApiProperty({ description: '텍스트 (한국어)' })
  textKo!: string;

  @ApiProperty({ description: '텍스트 (영어)' })
  textEn!: string;

  @ApiProperty({ description: '오디오 URL (한국어)', required: false })
  audioUrlKo?: string;

  @ApiProperty({ description: '오디오 URL (영어)', required: false })
  audioUrlEn?: string;
}

export class StoryPagesResponseDto {
  @ApiProperty({ description: '동화 ID' })
  storyId!: string;

  @ApiProperty({ description: '페이지 목록', type: [StoryPageDto] })
  pages!: StoryPageDto[];
}

export class PaginationMetaDto {
  @ApiProperty({ description: '전체 개수' })
  total!: number;

  @ApiProperty({ description: '현재 페이지' })
  page!: number;

  @ApiProperty({ description: '페이지당 개수' })
  limit!: number;

  @ApiProperty({ description: '전체 페이지 수' })
  totalPages!: number;
}

export class StoryListResponseDto {
  @ApiProperty({ description: '동화 목록', type: [StoryResponseDto] })
  data!: StoryResponseDto[];

  @ApiProperty({ description: '페이지네이션 정보' })
  meta!: PaginationMetaDto;
}
