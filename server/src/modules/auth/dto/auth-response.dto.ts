import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT Access Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: '사용자 정보',
    example: {
      userId: 'google-123456789',
      email: 'user@example.com',
      name: 'John Doe',
    },
  })
  user: {
    userId: string;
    email: string;
    name: string;
  };
}
