import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { CreateHistoryDto } from './dto/create-history.dto';
import { BatchCreateHistoryDto } from './dto/batch-create-history.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import {
  CurrentUser,
  CurrentUserData,
} from '../auth/decorators/current-user.decorator';

@ApiTags('History')
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  /**
   * 여러 히스토리 일괄 저장
   */
  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  async createBatch(@Body() batchDto: BatchCreateHistoryDto) {
    return await this.historyService.createBatch(batchDto.histories);
  }

  /**
   * 히스토리 조회 (필터링)
   */
  @Get()
  async findAll(@Query() query: HistoryQueryDto) {
    return await this.historyService.findAll(query);
  }

  /**
   * 카테고리별 사용 시간 통계
   */
  @Get('stats/category')
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