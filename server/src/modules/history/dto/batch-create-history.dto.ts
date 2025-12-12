import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateHistoryDto } from './create-history.dto';

export class BatchCreateHistoryDto {
  @ApiProperty({
    description: '생성할 히스토리 목록',
    type: [CreateHistoryDto],
    example: [
      {
        url: 'https://github.com',
        title: 'GitHub',
        useTime: 100
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHistoryDto)
  histories: CreateHistoryDto[];
}