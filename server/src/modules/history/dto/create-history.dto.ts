import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
} from "class-validator";

export class CreateHistoryDto {
  @ApiProperty({
    description: '방문한 페이지의 URL',
    example: 'https://github.com/trending'
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: '페이지 제목',
    example: 'Trending repositories on GitHub today'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: '체류 시간 (초 단위)',
    example: 120,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  useTime?: number; // 체류 시간 (초 단위)
}
