import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdviceService } from './advice.service';
import {
  CurrentUser,
  CurrentUserData,
} from '../auth/decorators/current-user.decorator';

@ApiTags('Advice')
@Controller('advice')
export class AdviceController {
  constructor(private readonly adviceService: AdviceService) {}

  @Get('daily')
  @ApiOperation({ summary: '일일 요약 조회' })
  async getDailySummary(@CurrentUser() currentUser: CurrentUserData) {
    return await this.adviceService.generateDailySummary(currentUser.id);
  }

  @Get('weekly')
  @ApiOperation({ summary: '주간 조언 조회' })
  async getWeeklyAdvice(@CurrentUser() currentUser: CurrentUserData) {
    return await this.adviceService.generateWeeklyAdvice(currentUser.id);
  }

  @Get('monthly')
  @ApiOperation({ summary: '월간 조언 조회' })
  async getMonthlyAdvice(@CurrentUser() currentUser: CurrentUserData) {
    return await this.adviceService.generateMonthlyAdvice(currentUser.id);
  }
}