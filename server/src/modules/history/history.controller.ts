import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { CreateHistoryDto } from './dto/create-history.dto';
import { BatchCreateHistoryDto } from './dto/batch-create-history.dto';
import { HistoryQueryDto } from './dto/history-query.dto';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  /**
   * 히스토리 생성 (자동 카테고리 분류)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createHistoryDto: CreateHistoryDto) {
    return await this.historyService.create(createHistoryDto);
  }

  /**
   * 여러 히스토리 일괄 생성
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
   * 특정 히스토리 조회
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.historyService.findOne(id);
  }

  /**
   * 히스토리 삭제
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.historyService.remove(id);
  }

  /**
   * 가장 많이 방문한 사이트 Top N
   */
  @Get('stats/top-visited/:userId')
  async getTopVisited(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return await this.historyService.getTopVisitedSites(
      userId,
      limit ? parseInt(limit.toString()) : 10,
    );
  }

  /**
   * 가장 오래 체류한 사이트 Top N
   */
  @Get('stats/top-time/:userId')
  async getTopTimeSpent(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return await this.historyService.getTopTimeSpentSites(
      userId,
      limit ? parseInt(limit.toString()) : 10,
    );
  }

  /**
   * 카테고리별 사용 시간 통계
   */
  @Get('stats/category/:userId')
  async getCategoryStats(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.historyService.getCategoryTimeStats(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * 시간대별 히스토리 개수
   */
  @Get('stats/hourly/:userId')
  async getHourlyStats(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.historyService.getHourlyStats(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}