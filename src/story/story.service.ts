import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
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
    const stories = (data ?? []).map((story) => this.mapToResponse(story));

    return {
      data: stories,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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

  private mapToResponse(
    data: Record<string, unknown>,
    includeCreatedAt = false,
  ): StoryResponseDto {
    const response: StoryResponseDto = {
      id: data.id as string,
      title: data.title_ko as string,
      titleEn: data.title_en as string,
      description: data.description_ko as string,
      descriptionEn: data.description_en as string,
      thumbnailUrl: data.thumbnail_url as string,
      category: data.category as StoryResponseDto['category'],
      ageGroup: data.age_group as StoryResponseDto['ageGroup'],
      duration: data.duration_minutes as number,
      pageCount: data.page_count as number,
      isLocked: !(data.is_free as boolean),
    };

    if (includeCreatedAt) {
      response.createdAt = data.created_at as string;
    }

    return response;
  }

  private mapPageToResponse(data: Record<string, unknown>): StoryPageDto {
    return {
      id: data.id as string,
      pageNumber: data.page_number as number,
      imageUrl: data.image_url as string,
      textKo: data.text_ko as string,
      textEn: data.text_en as string,
      audioUrlKo: data.audio_url_ko as string | undefined,
      audioUrlEn: data.audio_url_en as string | undefined,
    };
  }
}
