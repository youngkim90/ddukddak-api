import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { Tables } from '../types/database.types';
import { CreateFeedbackDto, FeedbackResponseDto } from './dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(user: User, dto: CreateFeedbackDto): Promise<FeedbackResponseDto> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('feedbacks')
      .insert({
        user_id: user.id,
        category: dto.category,
        rating: dto.rating,
        message: dto.message,
        source: dto.source,
        story_id: dto.storyId ?? null,
        page_number: dto.pageNumber ?? null,
        language: dto.language ?? null,
        contact_email: dto.contactEmail ?? null,
        metadata: dto.metadata ?? {},
      })
      .select()
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('피드백 저장에 실패했습니다.');
    }

    return this.mapToResponse(data);
  }

  private mapToResponse(data: Tables<'feedbacks'>): FeedbackResponseDto {
    return {
      id: data.id,
      category: data.category,
      rating: data.rating,
      message: data.message,
      status: data.status,
      createdAt: data.created_at,
    };
  }
}
