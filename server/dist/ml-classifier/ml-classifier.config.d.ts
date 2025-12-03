/**
 * ML 분류기 설정 파일
 * 카테고리별 대표 텍스트 및 분류 임계값 관리
 */
export interface CategoryConfig {
    id: string;
    name: string;
    representativeTexts: string[];
}
/**
 * 기본 카테고리 설정
 * 각 카테고리의 대표 텍스트를 기반으로 임베딩이 생성됩니다.
 */
export declare const DEFAULT_CATEGORIES: CategoryConfig[];
/**
 * ML 분류기 설정값
 */
export declare const ML_CLASSIFIER_CONFIG: {
    CLASSIFICATION_THRESHOLD: number;
    EMBEDDING_CACHE_TTL: number;
    MAX_BATCH_SIZE: number;
};
//# sourceMappingURL=ml-classifier.config.d.ts.map