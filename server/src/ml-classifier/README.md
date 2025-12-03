# ML Classifier Module

머신러닝 기반 크롬 히스토리 데이터 카테고리 분류 모듈

## 개요

Universal Sentence Encoder를 사용하여 웹 페이지의 제목, 메타데이터, URL을 분석하고 카테고리를 자동으로 분류합니다.

## 주요 기능

- **텍스트 임베딩**: URL + title + meta description을 벡터로 변환
- **코사인 유사도 계산**: 카테고리별 대표 임베딩과 비교
- **배치 처리**: 여러 히스토리를 한 번에 분류
- **자동 초기화**: 서버 시작 시 모델 자동 로딩

## 파일 구조

```
ml-classifier/
├── ml-classifier.module.ts      # NestJS 모듈 정의
├── ml-classifier.service.ts     # ML 분류 로직
├── ml-classifier.config.ts      # 카테고리 설정
└── index.ts                     # 내보내기
```

## 사용 예시

### 1. 단일 텍스트 분류

```typescript
import { MlClassifierService } from './ml-classifier/ml-classifier.service';
import { DEFAULT_CATEGORIES } from './ml-classifier/ml-classifier.config';

// 서비스 초기화
await mlClassifierService.initializeCategoryEmbeddings(DEFAULT_CATEGORIES);

// 텍스트 분류
const text = 'GitHub - TypeScript Documentation';
const result = await mlClassifierService.classify(text);

console.log(result);
// { categoryId: 'development', categoryName: '개발', confidence: 0.87 }
```

### 2. 배치 분류

```typescript
const texts = [
  'YouTube - Music Video',
  'Stack Overflow - React Hooks',
  'Netflix - Drama Series',
];

const results = await mlClassifierService.classifyBatch(texts);
```

## 기본 카테고리

- **업무** (work): 이메일, 회의, 프로젝트 문서
- **학습** (study): 튜토리얼, 온라인 강의, 기술 문서
- **엔터테인먼트** (entertainment): 유튜브, 넷플릭스, 음악
- **소셜** (social): SNS, 메신저
- **뉴스** (news): 뉴스 기사, 시사
- **쇼핑** (shopping): 온라인 쇼핑, 상품 검색
- **개발** (development): GitHub, Stack Overflow, API 문서
- **금융** (finance): 주식, 은행, 투자
- **건강** (health): 운동, 건강 정보, 다이어트
- **기타** (etc): 미분류

## 설정

[ml-classifier.config.ts](ml-classifier.config.ts)에서 다음을 수정할 수 있습니다:

- `CLASSIFICATION_THRESHOLD`: 분류 신뢰도 임계값 (기본값: 0.5)
- `EMBEDDING_CACHE_TTL`: 임베딩 캐시 유효 시간
- `MAX_BATCH_SIZE`: 배치 처리 최대 크기
- `DEFAULT_CATEGORIES`: 카테고리 및 대표 텍스트

## 성능 최적화

1. **배치 처리**: 여러 히스토리를 한 번에 처리하여 모델 호출 횟수 감소
2. **모델 재사용**: 서버 시작 시 1회만 로딩
3. **메모리 관리**: 임베딩 후 텐서 메모리 자동 해제

## 다음 단계

- 데이터베이스 엔티티 생성
- 히스토리 저장 시 자동 분류 적용
- 캐싱 전략 구현 (Redis)
