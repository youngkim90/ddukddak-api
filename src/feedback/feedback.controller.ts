import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../common/decorators';
import { ThrottleFeedback } from '../common/decorators';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, FeedbackResponseDto } from './dto';

@ApiTags('Feedback')
@ApiBearerAuth()
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ThrottleFeedback()
  @ApiOperation({ summary: '피드백 제출 (1분당 3회 제한)' })
  @ApiResponse({ status: 201, type: FeedbackResponseDto })
  @ApiResponse({ status: 401, description: '미인증' })
  @ApiResponse({ status: 429, description: '잠시 후 다시 시도해주세요.' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    return this.feedbackService.create(user, dto);
  }
}
