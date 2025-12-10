import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import '@tensorflow/tfjs-backend-cpu';
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingService.name);
  private model: use.UniversalSentenceEncoder | null = null;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  async onModuleInit() {
    // 서버 시작 시 모델 로드
    await this.loadModel();
  }

  private async loadModel(): Promise<void> {
    if (this.model) return;
    
    if (this.isLoading) {
      await this.loadPromise;
      return;
    }

    this.isLoading = true;
    this.loadPromise = (async () => {
      try {
        this.logger.log('Loading Universal Sentence Encoder model...');
        this.model = await use.load();
        this.logger.log('✅ Model loaded successfully');
      } catch (error) {
        this.logger.error('Failed to load model:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    })();

    await this.loadPromise;
  }

  /**
   * 텍스트를 임베딩 벡터로 변환
   */
  async embed(texts: string[]): Promise<number[][]> {
    await this.loadModel();

    if (!this.model) {
      throw new Error('Model not loaded');
    }

    const embeddings = await this.model.embed(texts);
    const embeddingsArray = await embeddings.array();
    
    // 메모리 정리
    embeddings.dispose();

    return embeddingsArray;
  }

  /**
   * 단일 텍스트 임베딩
   */
  async embedSingle(text: string): Promise<number[]> {
    const embeddings = await this.embed([text]);
    return embeddings[0];
  }

  /**
   * 코사인 유사도 계산
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * 가장 유사한 벡터 찾기
   */
  findMostSimilar(
    queryEmbedding: number[],
    candidateEmbeddings: Array<{ categoryId: string; categoryName: string; embedding: number[] }>,
  ): { id: string; name: string; similarity: number } {
    let maxSimilarity = -1;
    let mostSimilar = candidateEmbeddings[0];

    for (const candidate of candidateEmbeddings) {
      const similarity = this.cosineSimilarity(queryEmbedding, candidate.embedding);
      
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        mostSimilar = candidate;
      }
    }

    return {
      id: mostSimilar.categoryId,
      name: mostSimilar.categoryName,
      similarity: maxSimilarity,
    };
  }
}