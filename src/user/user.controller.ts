import { Controller, Get, Patch, Delete, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { User } from '@supabase/supabase-js';
import { CurrentUser } from '../common/decorators';
import { UserService } from './user.service';
import { UpdateUserDto, UserResponseDto } from './dto';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getProfile(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.userService.getProfile(user);
  }

  @Patch('me')
  @ApiOperation({ summary: '프로필 수정' })
  @ApiResponse({
    status: 200,
    description: '프로필 수정 성공',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.updateProfile(user, updateUserDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({ status: 204, description: '회원 탈퇴 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async deleteAccount(@CurrentUser() user: User): Promise<void> {
    return this.userService.deleteAccount(user);
  }
}
