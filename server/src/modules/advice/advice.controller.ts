import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  async getDailySummary(@CurrentUser() currentUser: CurrentUserData) {
    return await this.adviceService.generateDailySummary(currentUser.id);
  }

  @Get('weekly')
  async getWeeklyAdvice(@CurrentUser() currentUser: CurrentUserData) {
    return await this.adviceService.generateWeeklyAdvice(currentUser.id);
  }

  @Get('monthly')
  async getMonthlyAdvice(@CurrentUser() currentUser: CurrentUserData) {
    return await this.adviceService.generateMonthlyAdvice(currentUser.id);
  }
}