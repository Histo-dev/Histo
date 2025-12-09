import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class ClassifyPageDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  meta?: string;
}