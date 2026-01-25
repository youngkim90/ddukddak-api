import { Controller, Get, Put, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../common/decorators';
import { ProgressService } from './progress.service';
import { ProgressListResponseDto, ProgressResponseDto, UpdateProgressDto } from './dto';

@ApiTags('progress')
@ApiBearerAuth('access-token')
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  @ApiOperation({ summary: '내 진행률 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '진행률 목록 조회 성공',
    type: ProgressListResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async findAll(@CurrentUser() user: User): Promise<ProgressListResponseDto> {
    return this.progressService.findAll(user);
  }

  @Get(':storyId')
  @ApiOperation({ summary: '특정 동화 진행률 조회' })
  @ApiParam({ name: 'storyId', description: '동화 ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: '진행률 조회 성공',
    type: ProgressResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '진행률 없음' })
  async findOne(
    @CurrentUser() user: User,
    @Param('storyId', ParseUUIDPipe) storyId: string,
  ): Promise<ProgressResponseDto> {
    return this.progressService.findOne(user, storyId);
  }

  @Put(':storyId')
  @ApiOperation({ summary: '진행률 저장' })
  @ApiParam({ name: 'storyId', description: '동화 ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: '진행률 저장 성공',
    type: ProgressResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '동화 없음' })
  async upsert(
    @CurrentUser() user: User,
    @Param('storyId', ParseUUIDPipe) storyId: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ): Promise<ProgressResponseDto> {
    return this.progressService.upsert(user, storyId, updateProgressDto);
  }
}
