import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { History } from '../../entities/history.entity';
import { CreateHistoryDto } from './dto/create-history.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { ClassificationService } from '../ml/classification.service';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private readonly historyRepository: Repository<History>,
    private readonly classificationService: ClassificationService,
  ) {}

  /**
   * 히스토리 저장 (자동 카테고리 분류)
   */
  async create(createHistoryDto: CreateHistoryDto): Promise<History> {
    // ML로 카테고리 자동 분류
    const classification = await this.classificationService.classifyPage({
      url: createHistoryDto.url,
      title: createHistoryDto.title,
      meta: createHistoryDto.meta,
    });

    const history = this.historyRepository.create({
      userId: createHistoryDto.userId,
      url: createHistoryDto.url,
      title: createHistoryDto.title,
      meta: createHistoryDto.meta,
      useTime: createHistoryDto.useTime || 0,
      categoryId: classification.categoryId,
      visitedAt: new Date(),
    });

    return await this.historyRepository.save(history);
  }

  /**
   * 여러 히스토리 일괄 저장
   */
  async createBatch(histories: CreateHistoryDto[]): Promise<History[]> {
    const results: History[] = [];

    for (const historyDto of histories) {
      try {
        const history = await this.create(historyDto);
        results.push(history);
      } catch (error) {
        console.error(`Failed to create history for ${historyDto.url}:`, error);
      }
    }

    return results;
  }

  /**
   * 히스토리 조회 (필터링)
   */
  async findAll(query: HistoryQueryDto): Promise<History[]> {
    const {
      userId,
      categoryId,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = query;

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

    return await this.historyRepository.find({
      where: whereCondition,
      relations: ['category', 'user'],
      order: { visitedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
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
    limit: number = 3,
  ): Promise<Array<{ domain: string; count: number; totalTime: number }>> {
    const histories = await this.historyRepository.find({
      where: { userId },
      select: ['url', 'useTime'],
    });

    // 도메인별 집계
    const domainStats = new Map<
      string,
      { count: number; totalTime: number }
    >();

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
    limit: number = 3,
  ): Promise<Array<{ domain: string; count: number; totalTime: number }>> {
    const histories = await this.historyRepository.find({
      where: { userId },
      select: ['url', 'useTime'],
    });

    const domainStats = new Map<
      string,
      { count: number; totalTime: number }
    >();

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
    endDate?: Date,
  ): Promise<Array<{ categoryId: string; categoryName: string; totalTime: number; count: number }>> {
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
   * URL에서 도메인 추출
   */
  private extractDomain(url: string): string | null {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }
}