import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google OAuth Access Token',
    example: 'ya29.a0AfH6SMBx...',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
