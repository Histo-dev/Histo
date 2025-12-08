import { Injectable } from '@nestjs/common';
import { HistoryService } from '../history/history.service';

export interface AdviceMessage {
  type: 'increase' | 'decrease' | 'new' | 'warning' | 'praise';
  category: string;
  message: string;
  data?: any;
}

@Injectable()
export class AdviceService {
  constructor(private readonly historyService: HistoryService) {}

  /**
   * 주간 패턴 비교 및 조언 생성
   */
  async generateWeeklyAdvice(userId: string): Promise<AdviceMessage[]> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // 이번 주 통계
    const thisWeekStats = await this.historyService.getCategoryTimeStats(
      userId,
      oneWeekAgo,
      now,
    );

    // 지난 주 통계
    const lastWeekStats = await this.historyService.getCategoryTimeStats(
      userId,
      twoWeeksAgo,
      oneWeekAgo,
    );

    const advice: AdviceMessage[] = [];

    // 카테고리별 비교
    for (const current of thisWeekStats) {
      const previous = lastWeekStats.find(
        (s) => s.categoryId === current.categoryId,
      );

      if (!previous) {
        // 새로운 카테고리
        advice.push({
          type: 'new',
          category: current.categoryName,
          message: `📌 새롭게 ${current.categoryName} 카테고리가 생겼습니다.`,
          data: { time: current.totalTime, count: current.count },
        });
        continue;
      }

      const changePercent =
        ((current.totalTime - previous.totalTime) / previous.totalTime) * 100;

      if (changePercent > 25) {
        // 25% 이상 증가
        advice.push({
          type: 'increase',
          category: current.categoryName,
          message: `📈 ${current.categoryName} 시간이 지난주 대비 ${changePercent.toFixed(0)}% 증가했습니다.`,
          data: {
            previousTime: previous.totalTime,
            currentTime: current.totalTime,
            change: changePercent,
          },
        });
      } else if (changePercent < -25) {
        // 25% 이상 감소
        advice.push({
          type: 'decrease',
          category: current.categoryName,
          message: `📉 ${current.categoryName} 시간이 지난주 대비 ${Math.abs(changePercent).toFixed(0)}% 감소했습니다.`,
          data: {
            previousTime: previous.totalTime,
            currentTime: current.totalTime,
            change: changePercent,
          },
        });
      }
    }

    // 특정 카테고리별 맞춤 조언
    advice.push(...this.generateCategorySpecificAdvice(thisWeekStats));

    return advice;
  }

  /**
   * 카테고리별 맞춤 조언
   */
  private generateCategorySpecificAdvice(
    stats: Array<{ categoryName: string; totalTime: number; count: number }>,
  ): AdviceMessage[] {
    const advice: AdviceMessage[] = [];
    const totalTime = stats.reduce((sum, s) => sum + s.totalTime, 0);

    for (const stat of stats) {
      const percentage = (stat.totalTime / totalTime) * 100;

      // 엔터테인먼트 과다 경고
      if (stat.categoryName === '엔터테인먼트' && percentage > 40) {
        advice.push({
          type: 'warning',
          category: stat.categoryName,
          message: `⚠️ 엔터테인먼트 사이트 체류 시간이 전체의 ${percentage.toFixed(0)}%를 차지합니다. 균형을 맞춰보세요.`,
          data: { percentage, time: stat.totalTime },
        });
      }

      // 학습 시간 증가 칭찬
      if (stat.categoryName === '학습' && percentage > 30) {
        advice.push({
          type: 'praise',
          category: stat.categoryName,
          message: `🎉 학습 시간이 증가했습니다. 좋은 집중 흐름을 유지하세요!`,
          data: { percentage, time: stat.totalTime },
        });
      }

      // 업무 시간 감소 경고
      if (stat.categoryName === '업무' && percentage < 20) {
        advice.push({
          type: 'warning',
          category: stat.categoryName,
          message: `📉 업무 비중이 줄었습니다. 집중이 필요한 시간인가요?`,
          data: { percentage, time: stat.totalTime },
        });
      }
    }

    return advice;
  }

  /**
   * 월간 패턴 비교 및 조언 생성
   */
  async generateMonthlyAdvice(userId: string): Promise<AdviceMessage[]> {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 이번 달 통계
    const thisMonthStats = await this.historyService.getCategoryTimeStats(
      userId,
      oneMonthAgo,
      now,
    );

    // 지난 달 통계
    const lastMonthStats = await this.historyService.getCategoryTimeStats(
      userId,
      twoMonthsAgo,
      oneMonthAgo,
    );

    const advice: AdviceMessage[] = [];

    // 카테고리별 비교
    for (const current of thisMonthStats) {
      const previous = lastMonthStats.find(
        (s) => s.categoryId === current.categoryId,
      );

      if (!previous) {
        // 새로운 카테고리
        advice.push({
          type: 'new',
          category: current.categoryName,
          message: `📌 이번 달 새롭게 ${current.categoryName} 카테고리가 생겼습니다.`,
          data: { time: current.totalTime, count: current.count },
        });
        continue;
      }

      const changePercent =
        ((current.totalTime - previous.totalTime) / previous.totalTime) * 100;

      if (changePercent > 30) {
        // 30% 이상 증가
        advice.push({
          type: 'increase',
          category: current.categoryName,
          message: `📈 ${current.categoryName} 시간이 지난달 대비 ${changePercent.toFixed(0)}% 증가했습니다.`,
          data: {
            previousTime: previous.totalTime,
            currentTime: current.totalTime,
            change: changePercent,
          },
        });
      } else if (changePercent < -30) {
        // 30% 이상 감소
        advice.push({
          type: 'decrease',
          category: current.categoryName,
          message: `📉 ${current.categoryName} 시간이 지난달 대비 ${Math.abs(changePercent).toFixed(0)}% 감소했습니다.`,
          data: {
            previousTime: previous.totalTime,
            currentTime: current.totalTime,
            change: changePercent,
          },
        });
      }
    }

    // 월간 특정 조언
    advice.push(...this.generateMonthlySpecificAdvice(thisMonthStats));

    return advice;
  }

  /**
   * 월간 맞춤 조언
   */
  private generateMonthlySpecificAdvice(
    stats: Array<{ categoryName: string; totalTime: number; count: number }>,
  ): AdviceMessage[] {
    const advice: AdviceMessage[] = [];
    const totalTime = stats.reduce((sum, s) => sum + s.totalTime, 0);

    for (const stat of stats) {
      const percentage = (stat.totalTime / totalTime) * 100;
      const hoursPerDay = stat.totalTime / 30 / 60 / 60;

      // 개발 시간 지속 칭찬
      if (stat.categoryName === '개발' && hoursPerDay > 3) {
        advice.push({
          type: 'praise',
          category: stat.categoryName,
          message: `💻 이번 달 평균 하루 ${hoursPerDay.toFixed(1)}시간 개발에 집중했습니다. 멋진 성장입니다!`,
          data: { percentage, time: stat.totalTime, hoursPerDay },
        });
      }

      // 학습 일관성 칭찬
      if (stat.categoryName === '학습' && hoursPerDay > 2) {
        advice.push({
          type: 'praise',
          category: stat.categoryName,
          message: `📚 한 달간 꾸준히 학습했습니다. 평균 하루 ${hoursPerDay.toFixed(1)}시간의 학습 패턴이 유지되고 있어요!`,
          data: { percentage, time: stat.totalTime, hoursPerDay },
        });
      }

      // 소셜미디어 과다 경고
      if (stat.categoryName === '소셜미디어' && percentage > 35) {
        advice.push({
          type: 'warning',
          category: stat.categoryName,
          message: `⚠️ 소셜미디어가 전체 시간의 ${percentage.toFixed(0)}%를 차지합니다. 다른 활동과 균형을 맞춰보세요.`,
          data: { percentage, time: stat.totalTime },
        });
      }

      // 업무 생산성 피드백
      if (stat.categoryName === '업무' && percentage > 50) {
        advice.push({
          type: 'praise',
          category: stat.categoryName,
          message: `💼 업무에 충실한 한 달이었습니다. 생산적인 시간 관리를 하고 있어요!`,
          data: { percentage, time: stat.totalTime },
        });
      }
    }

    return advice;
  }

  /**
   * 일일 요약
   */
  async generateDailySummary(userId: string): Promise<{
    totalTime: number;
    topCategory: string;
    topDomain: string;
    advice: string[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const categoryStats = await this.historyService.getCategoryTimeStats(
      userId,
      today,
      tomorrow,
    );

    const topSites = await this.historyService.getTopTimeSpentSites(userId, 1);

    const totalTime = categoryStats.reduce((sum, s) => sum + s.totalTime, 0);
    const topCategory = categoryStats.sort((a, b) => b.totalTime - a.totalTime)[0];

    const advice: string[] = [];

    if (totalTime > 8 * 60 * 60) {
      // 8시간 이상
      advice.push('오늘 인터넷 사용 시간이 많았습니다. 휴식을 취하세요.');
    }

    if (topCategory) {
      advice.push(`오늘은 주로 ${topCategory.categoryName} 활동을 했습니다.`);
    }

    return {
      totalTime,
      topCategory: topCategory?.categoryName || '없음',
      topDomain: topSites[0]?.domain || '없음',
      advice,
    };
  }
}