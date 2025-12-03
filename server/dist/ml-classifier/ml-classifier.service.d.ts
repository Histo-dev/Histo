import { OnModuleInit } from '@nestjs/common';
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
export declare class MlClassifierService implements OnModuleInit {
    private readonly logger;
    private model;
    private categoryEmbeddings;
    private isModelLoaded;
    onModuleInit(): Promise<void>;
    /**
     * Universal Sentence Encoder 모델 로딩
     */
    loadModel(): Promise<void>;
    /**
     * 텍스트를 임베딩 벡터로 변환
     */
    embed(text: string): Promise<number[]>;
    /**
     * 여러 텍스트를 한번에 임베딩 (배치 처리)
     */
    embedBatch(texts: string[]): Promise<number[][]>;
    /**
     * 두 벡터 간 코사인 유사도 계산
     */
    cosineSimilarity(vecA: number[], vecB: number[]): number;
    /**
     * 카테고리 임베딩 설정 (초기화 또는 업데이트 시 사용)
     */
    setCategoryEmbeddings(categories: CategoryEmbedding[]): void;
    /**
     * 카테고리 대표 텍스트로부터 임베딩 생성 및 저장
     */
    initializeCategoryEmbeddings(categories: {
        id: string;
        name: string;
        representativeTexts: string[];
    }[]): Promise<void>;
    /**
     * 여러 임베딩의 평균 계산
     */
    private averageEmbeddings;
    /**
     * 텍스트를 카테고리로 분류
     */
    classify(text: string, threshold?: number): Promise<ClassificationResult | null>;
    /**
     * 배치로 여러 텍스트 분류
     */
    classifyBatch(texts: string[], threshold?: number): Promise<(ClassificationResult | null)[]>;
    /**
     * 모델 로딩 상태 확인
     */
    isReady(): boolean;
}
//# sourceMappingURL=ml-classifier.service.d.ts.map