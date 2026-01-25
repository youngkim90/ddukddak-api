import { Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import {
  ProgressResponseDto,
  ProgressListResponseDto,
  UpdateProgressDto,
} from './dto';

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

    const progressList = (data ?? []).map((item) =>
      this.mapToResponse(item),
    );

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
      throw new NotFoundException(
        `Progress for story ${storyId} not found`,
      );
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
      .upsert({
        user_id: user.id,
        story_id: storyId,
        current_page: updateProgressDto.currentPage,
        is_completed: updateProgressDto.isCompleted ?? false,
        last_read_at: new Date().toISOString(),
      })
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

  private mapToResponse(data: Record<string, unknown>): ProgressResponseDto {
    const stories = data.stories as Record<string, unknown> | null;

    return {
      storyId: data.story_id as string,
      storyTitle: (stories?.title_ko as string) ?? '',
      currentPage: data.current_page as number,
      totalPages: (stories?.page_count as number) ?? 0,
      isCompleted: data.is_completed as boolean,
      lastReadAt: data.last_read_at as string,
    };
  }
}
