import { ApiProperty } from '@nestjs/swagger';

export class FeedbackResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: string;
}
