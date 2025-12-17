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

      // Category representative sentences (enhanced keywords and subcategorization)
      const categoryTexts: Record<string, string> = {
        업무: 'work business email documents tasks meetings presentations spreadsheets collaboration project management office productivity tools enterprise internal systems corporate',
        학습: 'learning education course tutorial study online class lecture notes educational materials academic papers research school university educational platform lessons academy',
        개발: 'development programming coding GitHub GitLab developer documentation API reference technical blog Stack Overflow code review development tools IDE library framework source code',
        엔터테인먼트: 'video movies drama entertainment games music streaming YouTube Netflix entertainment content recreation hobby webtoon comics animation',
        소셜미디어: 'social media SNS community blog forum social network Instagram Twitter Facebook bulletin board comments communication followers',
        쇼핑: 'shopping purchase e-commerce online shopping mall products goods cart checkout delivery marketplace store discount sale price comparison',
        뉴스: 'news articles press media information breaking news headlines current affairs politics economy society newsletter newspaper report coverage',
        금융: 'finance banking securities investment stocks cryptocurrency exchange funds loans insurance asset management economy banking card payment',
        디자인: 'design UI UX graphic illustration Photoshop Figma Sketch Dribbble Behance portfolio art creation design tools colors fonts typography',
        건강: 'health medical hospital pharmacy exercise fitness diet nutrition yoga wellness health information disease symptoms treatment medical checkup medicine',
        여행: 'travel tourism hotel accommodation flight booking destinations restaurants tourist attractions tours resort vacation overseas travel domestic travel travel reviews guide',
        레퍼런스: 'wiki encyclopedia dictionary glossary manual guide documentation reference knowledge information search archive resources',
        기타: 'miscellaneous general website other uncategorized unclassified',
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