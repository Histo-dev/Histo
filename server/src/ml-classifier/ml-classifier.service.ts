import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as use from '@tensorflow-models/universal-sentence-encoder';

export interface CategoryEmbedding {
  id: string;
  name: string;
  embedding: number[];
}

export interface ClassificationResult {
  categoryId: string;
  categoryName: string;
  confidence: number;
}

@Injectable()
export class MlClassifierService implements OnModuleInit {
  private readonly logger = new Logger(MlClassifierService.name);
  private model: use.UniversalSentenceEncoder | null = null;
  private categoryEmbeddings: CategoryEmbedding[] = [];
  private isModelLoaded = false;

  async onModuleInit() {
    await this.loadModel();
  }

  /**
   * Universal Sentence Encoder 모델 로딩
   */
  async loadModel(): Promise<void> {
    try {
      this.logger.log('Loading Universal Sentence Encoder model...');
      this.model = await use.load();
      this.isModelLoaded = true;
      this.logger.log('Model loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load model', error);
      throw error;
    }
  }

  /**
   * 텍스트를 임베딩 벡터로 변환
   */
  async embed(text: string): Promise<number[]> {
    if (!this.isModelLoaded || !this.model) {
      throw new Error('Model is not loaded yet');
    }

    try {
      const embeddings = await this.model.embed([text]);
      const embeddingArray = await embeddings.array();
      embeddings.dispose(); // 메모리 해제

      if (!embeddingArray[0]) {
        throw new Error('Failed to generate embedding');
      }

      return embeddingArray[0];
    } catch (error) {
      this.logger.error(`Failed to embed text: ${text}`, error);
      throw error;
    }
  }

  /**
   * 여러 텍스트를 한번에 임베딩 (배치 처리)
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.isModelLoaded || !this.model) {
      throw new Error('Model is not loaded yet');
    }

    try {
      const embeddings = await this.model.embed(texts);
      const embeddingArray = await embeddings.array();
      embeddings.dispose(); // 메모리 해제
      return embeddingArray;
    } catch (error) {
      this.logger.error('Failed to embed batch texts', error);
      throw error;
    }
  }

  /**
   * 두 벡터 간 코사인 유사도 계산
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * 카테고리 임베딩 설정 (초기화 또는 업데이트 시 사용)
   */
  setCategoryEmbeddings(categories: CategoryEmbedding[]): void {
    this.categoryEmbeddings = categories;
    this.logger.log(`Category embeddings set: ${categories.length} categories`);
  }

  /**
   * 카테고리 대표 텍스트로부터 임베딩 생성 및 저장
   */
  async initializeCategoryEmbeddings(
    categories: { id: string; name: string; representativeTexts: string[] }[],
  ): Promise<void> {
    this.logger.log('Initializing category embeddings...');

    const categoryEmbeddings: CategoryEmbedding[] = [];

    for (const category of categories) {
      // 대표 텍스트들의 평균 임베딩 계산
      const embeddings = await this.embedBatch(category.representativeTexts);
      const avgEmbedding = this.averageEmbeddings(embeddings);

      categoryEmbeddings.push({
        id: category.id,
        name: category.name,
        embedding: avgEmbedding,
      });
    }

    this.setCategoryEmbeddings(categoryEmbeddings);
  }

  /**
   * 여러 임베딩의 평균 계산
   */
  private averageEmbeddings(embeddings: number[][]): number[] {
    if (!embeddings[0]) {
      throw new Error('No embeddings provided');
    }

    const embeddingLength = embeddings[0].length;
    const avgEmbedding = new Array(embeddingLength).fill(0);

    for (const embedding of embeddings) {
      for (let i = 0; i < embeddingLength; i++) {
        avgEmbedding[i] += embedding[i];
      }
    }

    for (let i = 0; i < embeddingLength; i++) {
      avgEmbedding[i] /= embeddings.length;
    }

    return avgEmbedding;
  }

  /**
   * 텍스트를 카테고리로 분류
   */
  async classify(text: string, threshold = 0.5): Promise<ClassificationResult | null> {
    if (this.categoryEmbeddings.length === 0) {
      throw new Error('Category embeddings not initialized');
    }

    const textEmbedding = await this.embed(text);

    let maxSimilarity = -1;
    let bestCategory: CategoryEmbedding | null = null;

    for (const category of this.categoryEmbeddings) {
      const similarity = this.cosineSimilarity(textEmbedding, category.embedding);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestCategory = category;
      }
    }

    // 임계값 이하면 null 반환 (분류 불가)
    if (maxSimilarity < threshold || !bestCategory) {
      return null;
    }

    return {
      categoryId: bestCategory.id,
      categoryName: bestCategory.name,
      confidence: maxSimilarity,
    };
  }

  /**
   * 배치로 여러 텍스트 분류
   */
  async classifyBatch(
    texts: string[],
    threshold = 0.5,
  ): Promise<(ClassificationResult | null)[]> {
    const textEmbeddings = await this.embedBatch(texts);

    return textEmbeddings.map((textEmbedding) => {
      let maxSimilarity = -1;
      let bestCategory: CategoryEmbedding | null = null;

      for (const category of this.categoryEmbeddings) {
        const similarity = this.cosineSimilarity(textEmbedding, category.embedding);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestCategory = category;
        }
      }

      if (maxSimilarity < threshold || !bestCategory) {
        return null;
      }

      return {
        categoryId: bestCategory.id,
        categoryName: bestCategory.name,
        confidence: maxSimilarity,
      };
    });
  }

  /**
   * 모델 로딩 상태 확인
   */
  isReady(): boolean {
    return this.isModelLoaded;
  }
}
