import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: '사용자 ID (UUID)' })
  id!: string;

  @ApiProperty({ description: '이메일 주소' })
  email!: string;

  @ApiProperty({ description: '닉네임', required: false })
  nickname?: string;

  @ApiProperty({ description: '프로필 이미지 URL', required: false })
  avatarUrl?: string;

  @ApiProperty({
    description: '로그인 제공자',
    enum: ['email', 'kakao', 'google', 'apple'],
  })
  provider!: string;

  @ApiProperty({ description: '가입일' })
  createdAt!: string;
}
