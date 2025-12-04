import { IsString, IsNotEmpty, IsUrl, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateHistoryDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  meta?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  useTime?: number; // 체류 시간 (초 단위)
}