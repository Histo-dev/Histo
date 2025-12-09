import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateUserCategoryAlertDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsInt()
  @Min(1)
  alertTime: number; // 알림 시간 (분 단위)
}