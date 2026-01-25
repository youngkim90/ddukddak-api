import { Injectable } from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateUserDto, UserResponseDto } from './dto';

@Injectable()
export class UserService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getProfile(user: User): Promise<UserResponseDto> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      // 사용자 테이블에 데이터가 없으면 Auth 정보로 반환
      return this.mapAuthUserToResponse(user);
    }

    return this.mapToResponse(data);
  }

  async updateProfile(user: User, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        nickname: updateUserDto.nickname,
        avatar_url: updateUserDto.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return this.mapToResponse(data);
  }

  async deleteAccount(user: User): Promise<void> {
    // 1. users 테이블에서 삭제
    await this.supabaseService.getAdminClient().from('users').delete().eq('id', user.id);

    // 2. Supabase Auth에서 사용자 삭제
    const { error } = await this.supabaseService.getAdminClient().auth.admin.deleteUser(user.id);

    if (error) {
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  }

  private mapToResponse(data: Record<string, unknown>): UserResponseDto {
    return {
      id: data.id as string,
      email: data.email as string,
      nickname: data.nickname as string | undefined,
      avatarUrl: data.avatar_url as string | undefined,
      provider: data.provider as string,
      createdAt: data.created_at as string,
    };
  }

  private mapAuthUserToResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email || '',
      nickname: user.user_metadata?.nickname,
      avatarUrl: user.user_metadata?.avatar_url,
      provider: user.app_metadata?.provider || 'email',
      createdAt: user.created_at,
    };
  }
}
