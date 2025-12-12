import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    description: '카테고리 ID',
    example: 'cat-development'
  })
  id: string;

  @ApiProperty({
    description: '카테고리 이름',
    example: 'Development'
  })
  name: string;

  @ApiProperty({
    description: '카테고리 설명',
    required: false,
    example: '프로그래밍 및 개발 관련'
  })
  description?: string;

  @ApiProperty({
    description: '카테고리 임베딩 벡터 (ML 분류용)',
    required: false
  })
  embedding?: string;

  @ApiProperty({
    description: '해당 카테고리의 히스토리 개수',
    required: false,
    example: 42
  })
  historyCount?: number;
}