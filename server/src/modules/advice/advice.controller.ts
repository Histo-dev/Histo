import { Controller, Get, Param } from '@nestjs/common';
import { AdviceService } from './advice.service';

@Controller('advice')
export class AdviceController {
  constructor(private readonly adviceService: AdviceService) {}

  @Get('weekly/:userId')
  async getWeeklyAdvice(@Param('userId') userId: string) {
    return await this.adviceService.generateWeeklyAdvice(userId);
  }

  @Get('daily/:userId')
  async getDailySummary(@Param('userId') userId: string) {
    return await this.adviceService.generateDailySummary(userId);
  }
}