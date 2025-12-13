import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { BatchCreateHistoryDto } from './dto/batch-create-history.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { HistoryResponseDto } from './dto/history-response.dto';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('History')
@ApiBearerAuth('access-token')
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  /**
   * 여러 히스토리 일괄 저장
   */
  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '히스토리 일괄 저장',
    description:
      '여러 개의 히스토리를 한번에 저장합니다. 중복된 히스토리(URL+title)는 사용 시간이 누적됩니다.',
  })
  @ApiBody({ type: BatchCreateHistoryDto })
  @ApiResponse({ status: 201, description: '히스토리 저장 성공' })
  async createBatch(
    @CurrentUser() currentUser: CurrentUserData,
    @Body() batchDto: BatchCreateHistoryDto
  ) {
    return await this.historyService.createBatch(batchDto.histories, currentUser.id);
  }

  /**
   * 오늘 날짜의 내 히스토리 조회
   */
  @Get('today')
  @ApiOperation({
    summary: '오늘의 히스토리 조회',
    description: '현재 로그인한 사용자의 오늘 날짜 히스토리를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '오늘의 히스토리 목록 조회 성공',
    type: [HistoryResponseDto],
  })
  async getTodayHistory(
    @CurrentUser() currentUser: CurrentUserData
  ): Promise<HistoryResponseDto[]> {
    return await this.historyService.getTodayHistory(currentUser.id);
  }

  /**
   * 히스토리 조회 (필터링)
   */
  @Get()
  @ApiOperation({
    summary: '히스토리 조회',
    description: '사용자 ID, 카테고리, 날짜 범위 등으로 필터링하여 히스토리를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '히스토리 목록 조회 성공', type: [HistoryResponseDto] })
  async findAll(@Query() query: HistoryQueryDto): Promise<HistoryResponseDto[]> {
    return await this.historyService.findAll(query);
  }

  /**
   * 카테고리별 사용 시간 통계
   */
  @Get('stats/category')
  @ApiOperation({
    summary: '카테고리별 통계',
    description: '기간별 카테고리별 사용 시간 및 방문 횟수 통계를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '통계 조회 성공' })
  async getCategoryStats(
    @CurrentUser() currentUser: CurrentUserData,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return await this.historyService.getCategoryTimeStats(
      currentUser.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  /**
   * 전체 사용자 카테고리별 평균 통계
   */
  @Get('stats/category/average')
  @ApiOperation({
    summary: '전체 사용자 카테고리별 평균',
    description: '모든 사용자의 카테고리별 평균 사용 시간을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '평균 통계 조회 성공' })
  async getCategoryAverageStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return await this.historyService.getCategoryAverageStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }
}
