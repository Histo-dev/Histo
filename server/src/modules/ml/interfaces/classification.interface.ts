export interface PageInfo {
  url: string;
  title: string;
  meta?: string; // meta description
}

export interface ClassificationResult {
  categoryId: string;
  categoryName: string;
  confidence: number; // 0~1 사이의 신뢰도
  embedding?: number[];
}

export interface CategoryEmbedding {
  categoryId: string;
  categoryName: string;
  embedding: number[];
}