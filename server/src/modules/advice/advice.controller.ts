import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  @ApiOperation({ summary: '일일 요약 조회', description: '오늘 하루 동안의 브라우징 활동 요약 및 AI 조언을 생성합니다.' })
  @ApiResponse({ status: 200, description: '일일 요약 생성 성공' })
  async getDailySummary(@CurrentUser() currentUser: CurrentUserData) {
    return await this.adviceService.generateDailySummary(currentUser.id);
  }

  @Get('weekly')
  @ApiOperation({ summary: '주간 조언 조회', description: '최근 7일간의 브라우징 패턴 분석 및 AI 조언을 생성합니다.' })
  @ApiResponse({ status: 200, description: '주간 조언 생성 성공' })
  async getWeeklyAdvice(@CurrentUser() currentUser: CurrentUserData) {
    return await this.adviceService.generateWeeklyAdvice(currentUser.id);
  }

  @Get('monthly')
  @ApiOperation({ summary: '월간 조언 조회', description: '최근 30일간의 브라우징 트렌드 분석 및 AI 조언을 생성합니다.' })
  @ApiResponse({ status: 200, description: '월간 조언 생성 성공' })
  async getMonthlyAdvice(@CurrentUser() currentUser: CurrentUserData) {
    return await this.adviceService.generateMonthlyAdvice(currentUser.id);
  }
}