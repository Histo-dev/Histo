import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Gemini를 사용하여 사용자 패턴 기반 조언 생성
   */
  async generateAdvice(userStats: {
    weeklyStats: Array<{ categoryName: string; totalTime: number; count: number }>;
    monthlyStats: Array<{ categoryName: string; totalTime: number; count: number }>;
    dailyStats: Array<{ categoryName: string; totalTime: number; count: number }>;
  }): Promise<string> {
    const prompt = this.buildPrompt(userStats);

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
        systemInstruction: `당신은 사용자의 인터넷 사용 패턴을 분석하고 생산적인 조언을 제공하는 전문가입니다.
사용자의 데이터를 분석하여 긍정적이고 실행 가능한 조언을 제공하세요.
- 조언은 구체적이고 실용적이어야 합니다
- 긍정적인 톤을 유지하세요
- 3-5개의 핵심 포인트로 구성하세요
- 각 포인트는 2-3문장으로 간결하게 작성하세요`,
      });

      const response = await result.response;
      return response.text() || '조언을 생성할 수 없습니다.';
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('조언 생성 중 오류가 발생했습니다.');
    }
  }

  /**
   * Gemini 프롬프트 생성
   */
  private buildPrompt(userStats: {
    weeklyStats: Array<{ categoryName: string; totalTime: number; count: number }>;
    monthlyStats: Array<{ categoryName: string; totalTime: number; count: number }>;
    dailyStats: Array<{ categoryName: string; totalTime: number; count: number }>;
  }): string {
    const formatStats = (stats: Array<{ categoryName: string; totalTime: number; count: number }>) => {
      return stats
        .map((s) => {
          const hours = (s.totalTime / 3600).toFixed(1);
          return `  - ${s.categoryName}: ${hours}시간 (방문 ${s.count}회)`;
        })
        .join('\n');
    };

    return `다음은 사용자의 인터넷 사용 패턴입니다:

## 일일 사용 패턴
${formatStats(userStats.dailyStats)}

## 주간 사용 패턴
${formatStats(userStats.weeklyStats)}

## 월간 사용 패턴
${formatStats(userStats.monthlyStats)}

위 데이터를 바탕으로 사용자에게 다음과 같은 조언을 제공해주세요:
1. 현재 사용 패턴의 긍정적인 측면
2. 개선이 필요한 영역
3. 구체적인 실천 방안
4. 다음 주/월에 집중할 목표`;
  }

  /**
   * 카테고리별 맞춤 조언 생성
   */
  async generateCategoryAdvice(
    categoryName: string,
    stats: {
      totalTime: number;
      count: number;
      trend: 'increase' | 'decrease' | 'stable';
      percentage: number;
    },
  ): Promise<string> {
    const prompt = `카테고리: ${categoryName}
사용 시간: ${(stats.totalTime / 3600).toFixed(1)}시간
방문 횟수: ${stats.count}회
전체 시간 대비 비율: ${stats.percentage.toFixed(1)}%
추세: ${stats.trend === 'increase' ? '증가' : stats.trend === 'decrease' ? '감소' : '안정'}

이 사용자에게 ${categoryName} 카테고리 사용에 대한 조언을 제공해주세요.`;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        },
        systemInstruction: `당신은 사용자의 특정 카테고리 사용 패턴을 분석하고 조언하는 전문가입니다.
조언은 간결하고 실용적이어야 하며, 2-3문장으로 작성하세요.`,
      });

      const response = await result.response;
      return response.text() || '조언을 생성할 수 없습니다.';
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('카테고리 조언 생성 중 오류가 발생했습니다.');
    }
  }
}
