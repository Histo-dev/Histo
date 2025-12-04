import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ClassifyPageDto } from './classify-page.dto';

export class BatchClassifyDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassifyPageDto)
  pages: ClassifyPageDto[];
}