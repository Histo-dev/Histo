import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Public()
  @Post('google/login')
  @ApiOperation({
    summary: 'Google OAuth 로그인',
    description:
      'Google Access Token을 검증하고 JWT 토큰을 발급합니다. 신규 사용자는 자동으로 등록됩니다.',
  })
  @ApiResponse({
    status: 201,
    description: 'JWT 토큰 발급 성공',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '유효하지 않은 Google Access Token',
  })
  async googleLogin(@Body() dto: GoogleLoginDto): Promise<AuthResponseDto> {
    // 1. Google Access Token 검증
    const googleUser = await this.authService.verifyGoogleToken(
      dto.accessToken,
    );

    // 2. 사용자 조회 또는 생성
    const userId = `google-${googleUser.id}`;
    let user = await this.userService.findByGoogleId(userId);

    if (!user) {
      // 신규 사용자 생성
      user = await this.userService.create({
        googleId: userId,
        email: googleUser.email,
        name: googleUser.name,
      });
    }

    // 3. JWT 토큰 생성
    const jwtToken = this.authService.generateJwtToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // 4. 응답
    return {
      accessToken: jwtToken,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  @Get('verify')
  @ApiOperation({
    summary: 'JWT 토큰 검증',
    description: '현재 JWT 토큰의 유효성을 확인하고 사용자 정보를 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '토큰이 유효함',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        user: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '유효하지 않거나 만료된 토큰',
  })
  async verifyToken(
    @Request() req: { user: { id: string; email: string; name: string } },
  ) {
    // JwtAuthGuard가 이미 토큰을 검증했으므로
    // req.user에 사용자 정보가 담겨있음
    return {
      valid: true,
      user: {
        userId: req.user.id,
        email: req.user.email,
        name: req.user.name,
      },
    };
  }
}
