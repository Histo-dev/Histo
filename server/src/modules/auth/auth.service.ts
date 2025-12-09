import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sign, verify, SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(private configService: ConfigService) {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    this.jwtSecret = secret;
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
  }

  /**
   * Google Access Token을 검증하고 사용자 정보 추출
   */
  async verifyGoogleToken(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`,
      );

      if (!response.ok) {
        throw new UnauthorizedException('Invalid Google access token');
      }

      const data = await response.json();

      return {
        id: data.id,
        email: data.email,
        name: data.name || data.email,
        picture: data.picture,
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to verify Google token');
    }
  }

  /**
   * JWT 토큰 생성
   */
  generateJwtToken(payload: JwtPayload): string {
    return sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    } as SignOptions);
  }

  /**
   * JWT 토큰 검증
   */
  verifyJwtToken(token: string): JwtPayload {
    try {
      const decoded = verify(token, this.jwtSecret) as JwtPayload;
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired JWT token');
    }
  }
}
