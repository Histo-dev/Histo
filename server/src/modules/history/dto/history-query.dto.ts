import { IsOptional, IsString, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class HistoryQueryDto {
  @ApiProperty({
    description: '사용자 ID',
    required: false,
    example: 'google-123456789'
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: '카테고리 ID',
    required: false,
    example: 'cat-development'
  })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({
    description: '시작 날짜 (ISO 8601)',
    required: false,
    example: '2024-01-01T00:00:00Z'
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: '종료 날짜 (ISO 8601)',
    required: false,
    example: '2024-01-31T23:59:59Z'
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: '조회할 최대 개수',
    required: false,
    example: 50,
    default: 50
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: '건너뛸 개수 (페이지네이션)',
    required: false,
    example: 0,
    default: 0
  })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  offset?: number;
}