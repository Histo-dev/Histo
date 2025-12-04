import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { CategoryService } from '../category/category.service';
import {
  PageInfo,
  ClassificationResult,
  CategoryEmbedding,
} from './interfaces/classification.interface';

@Injectable()
export class ClassificationService implements OnModuleInit {
  private readonly logger = new Logger(ClassificationService.name);
  private categoryEmbeddings: CategoryEmbedding[] = [];
  private readonly SIMILARITY_THRESHOLD = 0.3; // 최소 유사도 임계값

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly categoryService: CategoryService,
  ) {}

  async onModuleInit() {
    // 서버 시작 시 카테고리 임베딩 초기화
    await this.initializeCategoryEmbeddings();
  }

  /**
   * 카테고리별 대표 임베딩 생성 및 저장
   */
  private async initializeCategoryEmbeddings(): Promise<void> {
    try {
      this.logger.log('Initializing category embeddings...');

      const categories = await this.categoryService.findAll();

      // 카테고리별 대표 문장 정의
      const categoryTexts: Record<string, string> = {
        업무: '업무 이메일 문서 작업 회의 업무용 사이트',
        학습: '학습 강의 튜토리얼 교육 공부 온라인 강좌',
        개발: '개발 프로그래밍 코딩 GitHub 개발자 문서',
        엔터테인먼트: '영상 동영상 영화 게임 음악 엔터테인먼트',
        소셜미디어: '소셜미디어 SNS 커뮤니티 블로그 포럼',
        쇼핑: '쇼핑 구매 전자상거래 온라인쇼핑몰',
        뉴스: '뉴스 기사 언론 미디어 정보',
        기타: '기타 일반 웹사이트',
      };

      for (const category of categories) {
        const text = categoryTexts[category.name] || category.description || category.name;
        
        // 임베딩 생성
        const embedding = await this.embeddingService.embedSingle(text);
        
        // DB에 저장
        await this.categoryService.updateEmbedding(category.id, embedding);
        
        // 메모리에 캐시
        this.categoryEmbeddings.push({
          categoryId: category.id,
          categoryName: category.name,
          embedding,
        });

        this.logger.log(`✓ Generated embedding for category: ${category.name}`);
      }

      this.logger.log('✅ Category embeddings initialized');
    } catch (error) {
      this.logger.error('Failed to initialize category embeddings:', error);
    }
  }

  /**
   * 페이지 정보를 텍스트로 결합
   */
  private pageToText(page: PageInfo): string {
    const urlPath = this.extractUrlPath(page.url);
    const parts = [page.title];
    
    if (page.meta) {
      parts.push(page.meta);
    }
    
    if (urlPath) {
      parts.push(urlPath);
    }

    return parts.join(' ');
  }

  /**
   * URL에서 경로 추출 (도메인 제외)
   */
  private extractUrlPath(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').filter(Boolean).join(' ');
    } catch {
      return '';
    }
  }

  /**
   * 단일 페이지 분류
   */
  async classifyPage(page: PageInfo): Promise<ClassificationResult> {
    // 카테고리 임베딩이 없으면 초기화
    if (this.categoryEmbeddings.length === 0) {
      await this.initializeCategoryEmbeddings();
    }

    // 페이지 텍스트를 임베딩으로 변환
    const pageText = this.pageToText(page);
    const pageEmbedding = await this.embeddingService.embedSingle(pageText);

    // 가장 유사한 카테고리 찾기
    const mostSimilar = this.embeddingService.findMostSimilar(
      pageEmbedding,
      this.categoryEmbeddings,
    );

    // 유사도가 임계값보다 낮으면 "기타"로 분류
    let categoryId = mostSimilar.id;
    let categoryName = mostSimilar.name;
    let confidence = mostSimilar.similarity;

    if (confidence < this.SIMILARITY_THRESHOLD) {
      const defaultCategory = this.categoryEmbeddings.find(
        (c) => c.categoryName === '기타',
      );
      if (defaultCategory) {
        categoryId = defaultCategory.categoryId;
        categoryName = defaultCategory.categoryName;
        confidence = 0.5; // 기본 신뢰도
      }
    }

    return {
      categoryId,
      categoryName,
      confidence,
      embedding: pageEmbedding,
    };
  }

  /**
   * 여러 페이지 일괄 분류
   */
  async classifyPages(pages: PageInfo[]): Promise<ClassificationResult[]> {
    const results: ClassificationResult[] = [];

    for (const page of pages) {
      try {
        const result = await this.classifyPage(page);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to classify page: ${page.url}`, error);
        
        // 에러 발생 시 "기타"로 분류
        const defaultCategory = this.categoryEmbeddings.find(
          (c) => c.categoryName === '기타',
        );
        
        results.push({
          categoryId: defaultCategory?.categoryId || '',
          categoryName: '기타',
          confidence: 0,
        });
      }
    }

    return results;
  }

  /**
   * 카테고리 임베딩 새로고침 (카테고리 추가/수정 시 호출)
   */
  async refreshCategoryEmbeddings(): Promise<void> {
    this.categoryEmbeddings = [];
    await this.initializeCategoryEmbeddings();
  }
}