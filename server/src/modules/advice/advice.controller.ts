import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdviceService } from './advice.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../auth/decorators/current-user.decorator';

@ApiTags('Advice')
@Controller('advice')
export class AdviceController {
  constructor(private readonly adviceService: AdviceService) {}

  @Get('daily')
  @UseGuards(SupabaseAuthGuard)
  async getDailySummary(@CurrentUser() currentUser: CurrentUserData) {
    return await this.adviceService.generateDailySummary(currentUser.id);
  }

  @Get('weekly')
  @UseGuards(SupabaseAuthGuard)
  async getWeeklyAdvice(@CurrentUser() currentUser: CurrentUserData) {
    return await this.adviceService.generateWeeklyAdvice(currentUser.id);
  }

  @Get('monthly')
  @UseGuards(SupabaseAuthGuard)
  async getMonthlyAdvice(@CurrentUser() currentUser: CurrentUserData) {
    return await this.adviceService.generateMonthlyAdvice(currentUser.id);
  }
}