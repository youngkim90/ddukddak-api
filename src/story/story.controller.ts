import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public, RequireSubscription } from '../common/decorators';
import { StoryService } from './story.service';
import {
  StoryListResponseDto,
  StoryPagesResponseDto,
  StoryQueryDto,
  StoryResponseDto,
} from './dto';

@ApiTags('stories')
@Controller('stories')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '동화 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '동화 목록 조회 성공',
    type: StoryListResponseDto,
  })
  async findAll(@Query() query: StoryQueryDto): Promise<StoryListResponseDto> {
    return this.storyService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '동화 상세 조회' })
  @ApiParam({ name: 'id', description: '동화 ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: '동화 상세 조회 성공',
    type: StoryResponseDto,
  })
  @ApiResponse({ status: 404, description: '동화를 찾을 수 없음' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<StoryResponseDto> {
    return this.storyService.findOne(id);
  }

  @Get(':id/pages')
  @RequireSubscription()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '동화 페이지 콘텐츠 조회 (구독 필요)' })
  @ApiParam({ name: 'id', description: '동화 ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: '페이지 조회 성공',
    type: StoryPagesResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '구독 필요' })
  @ApiResponse({ status: 404, description: '동화를 찾을 수 없음' })
  async findPages(@Param('id', ParseUUIDPipe) id: string): Promise<StoryPagesResponseDto> {
    return this.storyService.findPages(id);
  }
}
