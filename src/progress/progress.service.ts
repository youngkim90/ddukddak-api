import { Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { Tables } from '../types/database.types';
import { ProgressResponseDto, ProgressListResponseDto, UpdateProgressDto } from './dto';

type ProgressWithStory = Tables<'reading_progress'> & {
  stories: Pick<Tables<'stories'>, 'title_ko' | 'page_count'> | null;
};

@Injectable()
export class ProgressService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(user: User): Promise<ProgressListResponseDto> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('reading_progress')
      .select(
        `
        *,
        stories:story_id (
          title_ko,
          page_count
        )
      `,
      )
      .eq('user_id', user.id)
      .order('last_read_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch progress: ${error.message}`);
    }

    const progressList = (data ?? []).map((item) => this.mapToResponse(item));

    return { data: progressList };
  }

  async findOne(user: User, storyId: string): Promise<ProgressResponseDto> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('reading_progress')
      .select(
        `
        *,
        stories:story_id (
          title_ko,
          page_count
        )
      `,
      )
      .eq('user_id', user.id)
      .eq('story_id', storyId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Progress for story ${storyId} not found`);
    }

    return this.mapToResponse(data);
  }

  async upsert(
    user: User,
    storyId: string,
    updateProgressDto: UpdateProgressDto,
  ): Promise<ProgressResponseDto> {
    // First, verify the story exists and get its info
    const { data: story, error: storyError } = await this.supabaseService
      .getClient()
      .from('stories')
      .select('id, title_ko, page_count')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      throw new NotFoundException(`Story with ID ${storyId} not found`);
    }

    // Upsert progress
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('reading_progress')
      .upsert(
        {
          user_id: user.id,
          story_id: storyId,
          current_page: updateProgressDto.currentPage,
          is_completed: updateProgressDto.isCompleted ?? false,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,story_id' },
      )
      .select(
        `
        *,
        stories:story_id (
          title_ko,
          page_count
        )
      `,
      )
      .single();

    if (error || !data) {
      throw new Error(`Failed to update progress: ${error?.message}`);
    }

    return this.mapToResponse(data);
  }

  async resetAll(user: User): Promise<{ message: string }> {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('reading_progress')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to reset progress: ${error.message}`);
    }

    return { message: 'All progress reset successfully' };
  }

  private mapToResponse(data: ProgressWithStory): ProgressResponseDto {
    return {
      storyId: data.story_id,
      storyTitle: data.stories?.title_ko ?? '',
      currentPage: data.current_page,
      totalPages: data.stories?.page_count ?? 0,
      isCompleted: data.is_completed,
      lastReadAt: data.last_read_at ?? '',
    };
  }
}
