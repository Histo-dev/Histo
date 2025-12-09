import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { CreateHistoryDto } from './dto/create-history.dto';
import { BatchCreateHistoryDto } from './dto/batch-create-history.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../auth/decorators/current-user.decorator';

@ApiTags('History')
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  /**
   * 히스토리 저장 (자동 카테고리 분류)
   */
  @Post()
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createHistoryDto: CreateHistoryDto) {
    return await this.historyService.create(createHistoryDto);
  }

  /**
   * 여러 히스토리 일괄 저장
   */
  @Post('batch')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBatch(@Body() batchDto: BatchCreateHistoryDto) {
    return await this.historyService.createBatch(batchDto.histories);
  }

  /**
   * 히스토리 조회 (필터링)
   */
  @Get()
  @UseGuards(SupabaseAuthGuard)
  async findAll(@Query() query: HistoryQueryDto) {
    return await this.historyService.findAll(query);
  }

  /**
   * 카테고리별 사용 시간 통계
   */
  @Get('stats/category')
  @UseGuards(SupabaseAuthGuard)
  async getCategoryStats(
    @CurrentUser() currentUser: CurrentUserData,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.historyService.getCategoryTimeStats(
      currentUser.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}