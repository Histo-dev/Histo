import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateHistoryDto } from './create-history.dto';

export class BatchCreateHistoryDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHistoryDto)
  histories: CreateHistoryDto[];
}