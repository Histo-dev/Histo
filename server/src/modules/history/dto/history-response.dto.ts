import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ description: '카테고리 ID' })
  id: string;

  @ApiProperty({ description: '카테고리 이름' })
  name: string;
}

export class HistoryResponseDto {
  @ApiProperty({ description: '히스토리 ID' })
  id: string;

  @ApiProperty({ description: '사용자 ID' })
  userId: string;

  @ApiProperty({ description: '카테고리 ID' })
  categoryId: string;

  @ApiProperty({ description: 'URL' })
  url: string;

  @ApiProperty({ description: '페이지 제목' })
  title: string;

  @ApiProperty({ description: '메타 정보', required: false })
  meta?: string;

  @ApiProperty({ description: '사용 시간 (초)', example: 120 })
  useTime: number;

  @ApiProperty({ description: '방문 시간' })
  visitedAt: Date;

  @ApiProperty({ description: '카테고리 정보', type: CategoryResponseDto, required: false })
  category?: CategoryResponseDto;

  @ApiProperty({ description: '도메인 이름' })
  domain: string;
}
