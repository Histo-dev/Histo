import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateUserDomainAlertDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  host: string; // 도메인 (예: youtube.com)

  @IsInt()
  @Min(1)
  alertTime: number; // 알림 시간 (분 단위)
}