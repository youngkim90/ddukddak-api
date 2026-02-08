import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Tables } from '../types/database.types';
import {
  StoryResponseDto,
  StoryListResponseDto,
  StoryPagesResponseDto,
  StoryPageDto,
  StoryQueryDto,
} from './dto';

@Injectable()
export class StoryService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(query: StoryQueryDto): Promise<StoryListResponseDto> {
    const { category, ageGroup, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    let queryBuilder = this.supabaseService
      .getClient()
      .from('stories')
      .select('*', { count: 'exact' });

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    if (ageGroup) {
      queryBuilder = queryBuilder.eq('age_group', ageGroup);
    }

    const { data, error, count } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch stories: ${error.message}`);
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);
    const stories = (data ?? []).map((story) => this.mapToResponse(story));

    return {
      stories,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<StoryResponseDto> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('stories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }

    return this.mapToResponse(data, true);
  }

  async findPages(id: string): Promise<StoryPagesResponseDto> {
    // First, verify the story exists
    const { data: story, error: storyError } = await this.supabaseService
      .getClient()
      .from('stories')
      .select('id')
      .eq('id', id)
      .single();

    if (storyError || !story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }

    // Fetch pages
    const { data: pages, error: pagesError } = await this.supabaseService
      .getClient()
      .from('story_pages')
      .select('*')
      .eq('story_id', id)
      .order('page_number', { ascending: true });

    if (pagesError) {
      throw new Error(`Failed to fetch story pages: ${pagesError.message}`);
    }

    return {
      storyId: id,
      pages: (pages ?? []).map((page) => this.mapPageToResponse(page)),
    };
  }

  private mapToResponse(data: Tables<'stories'>, includeCreatedAt = false): StoryResponseDto {
    const response: StoryResponseDto = {
      id: data.id,
      titleKo: data.title_ko,
      titleEn: data.title_en ?? '',
      descriptionKo: data.description_ko ?? '',
      descriptionEn: data.description_en ?? '',
      thumbnailUrl: data.thumbnail_url ?? '',
      category: (data.category ?? 'adventure') as StoryResponseDto['category'],
      ageGroup: (data.age_group ?? '3-5') as StoryResponseDto['ageGroup'],
      durationMinutes: data.duration_minutes ?? 0,
      pageCount: data.page_count ?? 0,
      isFree: data.is_free,
      bgmUrl: data.bgm_url ?? undefined,
    };

    if (includeCreatedAt) {
      response.createdAt = data.created_at;
    }

    return response;
  }

  private mapPageToResponse(data: Tables<'story_pages'>): StoryPageDto {
    return {
      id: data.id,
      pageNumber: data.page_number,
      imageUrl: data.image_url ?? '',
      textKo: data.text_ko ?? '',
      textEn: data.text_en ?? '',
      mediaType: (data.media_type ?? 'image') as 'image' | 'video',
      videoUrl: data.video_url ?? undefined,
      audioUrlKo: data.audio_url_ko ?? undefined,
      audioUrlEn: data.audio_url_en ?? undefined,
    };
  }
}
