import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { History } from '../../entities/history.entity';
import { CreateHistoryDto } from './dto/create-history.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { HistoryResponseDto } from './dto/history-response.dto';
import { ClassificationService } from '../ml/classification.service';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private readonly historyRepository: Repository<History>,
    private readonly classificationService: ClassificationService
  ) {}

  /**
   * 히스토리 저장 (자동 카테고리 분류)
   */
  async create(createHistoryDto: CreateHistoryDto, userId: string): Promise<History> {
    // ML로 카테고리 자동 분류
    const classification = await this.classificationService.classifyPage({
      url: createHistoryDto.url,
      title: createHistoryDto.title,
    });

    // URL에서 도메인 추출
    const domain = this.extractDomain(createHistoryDto.url);

    const history = this.historyRepository.create({
      userId: userId,
      url: createHistoryDto.url,
      title: createHistoryDto.title,
      useTime: createHistoryDto.useTime || 0,
      domain: domain || '',
      categoryId: classification.categoryId,
      visitedAt: new Date(),
    });

    return await this.historyRepository.save(history);
  }

  /**
   * 여러 히스토리 일괄 저장
   */
  async createBatch(histories: CreateHistoryDto[], userId: string): Promise<History[]> {
    const results: History[] = [];

    for (const historyDto of histories) {
      try {
        const existingHistory = await this.historyRepository.findOne({
          where: {
            url: historyDto.url,
            title: historyDto.title,
            userId: userId,
          },
        });
        if (existingHistory) {
          existingHistory.useTime += historyDto.useTime || 0;
          existingHistory.visitedAt = new Date(); // 마지막 방문 시간 업데이트
          await this.historyRepository.save(existingHistory);
          results.push(existingHistory);
        } else {
          const history = await this.create(historyDto, userId);
          results.push(history);
        }
      } catch (error) {
        console.error(`Failed to create history for ${historyDto.url}:`, error);
      }
    }

    return results;
  }

  /**
   * 오늘 날짜의 히스토리 조회
   */
  async getTodayHistory(userId: string): Promise<HistoryResponseDto[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const histories = await this.historyRepository.find({
      where: {
        userId,
        visitedAt: Between(today, tomorrow),
      },
      relations: ['category'],
      order: { visitedAt: 'DESC' },
    });

    return histories.map((history) => this.toResponseDto(history));
  }

  /**
   * 히스토리 조회 (필터링)
   */
  async findAll(query: HistoryQueryDto): Promise<HistoryResponseDto[]> {
    const { userId, categoryId, startDate, endDate, limit = 50, offset = 0 } = query;

    const whereCondition: any = {};

    if (userId) {
      whereCondition.userId = userId;
    }

    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }

    // 날짜 필터
    if (startDate && endDate) {
      whereCondition.visitedAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereCondition.visitedAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereCondition.visitedAt = LessThanOrEqual(new Date(endDate));
    }

    const histories = await this.historyRepository.find({
      where: whereCondition,
      relations: ['category'],
      order: { visitedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return histories.map((history) => this.toResponseDto(history));
  }

  /**
   * 특정 히스토리 조회
   */
  async findOne(id: string): Promise<History> {
    const history = await this.historyRepository.findOne({
      where: { id },
      relations: ['category', 'user'],
    });

    if (!history) {
      throw new NotFoundException(`History with ID '${id}' not found`);
    }

    return history;
  }

  /**
   * 히스토리 삭제
   */
  async remove(id: string): Promise<void> {
    const history = await this.findOne(id);
    await this.historyRepository.remove(history);
  }

  /**
   * 사용자별 총 히스토리 개수
   */
  async countByUser(userId: string): Promise<number> {
    return await this.historyRepository.count({
      where: { userId },
    });
  }

  /**
   * 가장 많이 방문한 사이트 Top N
   */
  async getTopVisitedSites(
    userId: string,
    limit: number = 3
  ): Promise<Array<{ domain: string; count: number; totalTime: number }>> {
    const histories = await this.historyRepository.find({
      where: { userId },
      select: ['url', 'useTime'],
    });

    // 도메인별 집계
    const domainStats = new Map<string, { count: number; totalTime: number }>();

    for (const history of histories) {
      const domain = this.extractDomain(history.url);
      if (!domain) continue;

      const stats = domainStats.get(domain) || { count: 0, totalTime: 0 };
      stats.count += 1;
      stats.totalTime += history.useTime;
      domainStats.set(domain, stats);
    }

    // 방문 횟수 기준 정렬
    return Array.from(domainStats.entries())
      .map(([domain, stats]) => ({
        domain,
        count: stats.count,
        totalTime: stats.totalTime,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * 가장 오래 체류한 사이트 Top N
   */
  async getTopTimeSpentSites(
    userId: string,
    limit: number = 3
  ): Promise<Array<{ domain: string; count: number; totalTime: number }>> {
    const histories = await this.historyRepository.find({
      where: { userId },
      select: ['url', 'useTime'],
    });

    const domainStats = new Map<string, { count: number; totalTime: number }>();

    for (const history of histories) {
      const domain = this.extractDomain(history.url);
      if (!domain) continue;

      const stats = domainStats.get(domain) || { count: 0, totalTime: 0 };
      stats.count += 1;
      stats.totalTime += history.useTime;
      domainStats.set(domain, stats);
    }

    // 체류 시간 기준 정렬
    return Array.from(domainStats.entries())
      .map(([domain, stats]) => ({
        domain,
        count: stats.count,
        totalTime: stats.totalTime,
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, limit);
  }

  /**
   * 카테고리별 사용 시간 집계
   */
  async getCategoryTimeStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<
    Array<{ categoryId: string; categoryName: string; totalTime: number; count: number }>
  > {
    const whereCondition: any = { userId };

    if (startDate && endDate) {
      whereCondition.visitedAt = Between(startDate, endDate);
    } else if (startDate) {
      whereCondition.visitedAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      whereCondition.visitedAt = LessThanOrEqual(endDate);
    }

    const histories = await this.historyRepository.find({
      where: whereCondition,
      relations: ['category'],
    });

    // 카테고리별 집계
    const categoryStats = new Map<
      string,
      { categoryName: string; totalTime: number; count: number }
    >();

    for (const history of histories) {
      if (!history.category) continue;

      const stats = categoryStats.get(history.categoryId) || {
        categoryName: history.category.name,
        totalTime: 0,
        count: 0,
      };

      stats.totalTime += history.useTime;
      stats.count += 1;
      categoryStats.set(history.categoryId, stats);
    }

    return Array.from(categoryStats.entries()).map(([categoryId, stats]) => ({
      categoryId,
      categoryName: stats.categoryName,
      totalTime: stats.totalTime,
      count: stats.count,
    }));
  }

  /**
   * 전체 사용자 카테고리별 평균 통계
   */
  async getCategoryAverageStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ categoryName: string; averageTime: number }>> {
    const whereCondition: any = {};

    if (startDate && endDate) {
      whereCondition.visitedAt = Between(startDate, endDate);
    } else if (startDate) {
      whereCondition.visitedAt = MoreThanOrEqual(startDate);
    } else if (endDate) {
      whereCondition.visitedAt = LessThanOrEqual(endDate);
    }

    const histories = await this.historyRepository.find({
      where: whereCondition,
      relations: ['category'],
    });

    // 카테고리별 사용자별 집계
    const userCategoryStats = new Map<string, Map<string, number>>(); // categoryId -> (userId -> totalTime)

    for (const history of histories) {
      if (!history.category) continue;

      if (!userCategoryStats.has(history.categoryId)) {
        userCategoryStats.set(history.categoryId, new Map());
      }

      const categoryUsers = userCategoryStats.get(history.categoryId)!;
      const currentTime = categoryUsers.get(history.userId) || 0;
      categoryUsers.set(history.userId, currentTime + history.useTime);
    }

    // 전체 유저 수 확인
    const uniqueUsers = new Set<string>();
    for (const userMap of userCategoryStats.values()) {
      for (const userId of userMap.keys()) {
        uniqueUsers.add(userId);
      }
    }

    // 유저가 1명 이하면 더미 데이터 반환 (중심 60분 기준 골고루 분산)
    if (uniqueUsers.size <= 1) {
      console.log('[histo] only 1 or no user data, returning dummy average');
      return [
        { categoryName: '업무', averageTime: 3600 }, // 60분 (중심)
        { categoryName: '소셜', averageTime: 3900 }, // 65분 (+8%)
        { categoryName: '동영상', averageTime: 3300 }, // 55분 (-8%)
        { categoryName: '뉴스', averageTime: 4200 }, // 70분 (+17%)
        { categoryName: '쇼핑', averageTime: 3000 }, // 50분 (-17%)
        { categoryName: '기타', averageTime: 2700 }, // 45분 (-25%)
      ];
    }

    // 카테고리별 평균 계산
    const result: Array<{ categoryName: string; averageTime: number }> = [];

    for (const [categoryId, userTimes] of userCategoryStats.entries()) {
      // 카테고리 이름 찾기
      const sampleHistory = histories.find((h) => h.categoryId === categoryId);
      if (!sampleHistory?.category) continue;

      const totalTime = Array.from(userTimes.values()).reduce((sum, time) => sum + time, 0);
      const userCount = userTimes.size;
      const averageTime = userCount > 0 ? Math.round(totalTime / userCount) : 0;

      result.push({
        categoryName: sampleHistory.category.name,
        averageTime,
      });
    }

    // 데이터가 없을 경우 더미 데이터 반환 (중심 60분 기준 골고루 분산)
    if (result.length === 0) {
      return [
        { categoryName: '업무', averageTime: 3600 }, // 60분 (중심)
        { categoryName: '소셜', averageTime: 3900 }, // 65분 (+8%)
        { categoryName: '동영상', averageTime: 3300 }, // 55분 (-8%)
        { categoryName: '뉴스', averageTime: 4200 }, // 70분 (+17%)
        { categoryName: '쇼핑', averageTime: 3000 }, // 50분 (-17%)
        { categoryName: '기타', averageTime: 2700 }, // 45분 (-25%)
      ];
    }

    return result;
  }

  /**
   * URL에서 도메인 추출
   * 프로토콜이 없는 URL(예: google.com)도 처리
   */
  private extractDomain(url: string): string | null {
    try {
      // 프로토콜이 없으면 https://를 추가
      const urlWithProtocol =
        url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

      const parsedUrl = new URL(urlWithProtocol);
      return parsedUrl.hostname;
    } catch {
      // URL 파싱 실패 시 null 반환
      return null;
    }
  }

  /**
   * History 엔티티를 응답 DTO로 변환 (embedding 제외)
   */
  private toResponseDto(history: History): HistoryResponseDto {
    return {
      id: history.id,
      userId: history.userId,
      categoryId: history.categoryId,
      url: history.url,
      title: history.title,
      meta: history.meta,
      useTime: history.useTime,
      visitedAt: history.visitedAt,
      domain: history.domain || '',
      category: history.category
        ? {
            id: history.category.id,
            name: history.category.name,
          }
        : undefined,
    };
  }
}
