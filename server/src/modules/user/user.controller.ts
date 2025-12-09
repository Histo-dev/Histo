import {
  Controller,
  Get,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  CurrentUser,
  CurrentUserData,
} from '../auth/decorators/current-user.decorator';

@ApiTags('User')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@CurrentUser() currentUser: CurrentUserData) {
    // 인증된 사용자 정보로 DB에서 찾거나 생성
    const { user, isNewUser } = await this.userService.findOrCreate({
      email: currentUser.email,
      name: currentUser.name,
    });

    return {
      message: isNewUser ? 'Sign-up successful' : 'Login successful',
      user,
    };
  }

  @Get('me')
  async getMe(@CurrentUser() currentUser: CurrentUserData) {
    return await this.userService.findByEmail(currentUser.email);
  }

  @Delete('leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() currentUser: CurrentUserData) {
    await this.userService.remove(currentUser.id);
  }
}