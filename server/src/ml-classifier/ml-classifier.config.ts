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
export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    id: 'work',
    name: '업무',
    representativeTexts: [
      '업무 이메일 확인하기',
      '회의 일정 관리',
      '프로젝트 문서 작성',
      '업무 협업 도구',
      '사내 공지사항',
      'work email meeting project document collaboration',
    ],
  },
  {
    id: 'study',
    name: '학습',
    representativeTexts: [
      '프로그래밍 튜토리얼',
      '온라인 강의 수강',
      '기술 문서 읽기',
      '코딩 실습하기',
      '학습 자료 검색',
      'programming tutorial documentation learning course education',
    ],
  },
  {
    id: 'entertainment',
    name: '엔터테인먼트',
    representativeTexts: [
      '유튜브 영상 시청',
      '넷플릭스 드라마 보기',
      '음악 듣기',
      '게임하기',
      '웹툰 보기',
      'youtube video movie music game entertainment streaming',
    ],
  },
  {
    id: 'social',
    name: '소셜',
    representativeTexts: [
      '인스타그램 피드 보기',
      '페이스북 친구 소식',
      '트위터 타임라인',
      '메신저 대화하기',
      '소셜 미디어',
      'instagram facebook twitter messenger social media chat',
    ],
  },
  {
    id: 'news',
    name: '뉴스',
    representativeTexts: [
      '오늘의 뉴스 읽기',
      '시사 기사 확인',
      '경제 뉴스',
      '정치 뉴스',
      '세계 뉴스',
      'news article journalism current events press',
    ],
  },
  {
    id: 'shopping',
    name: '쇼핑',
    representativeTexts: [
      '온라인 쇼핑하기',
      '상품 검색',
      '가격 비교',
      '장바구니 확인',
      '쿠팡 아마존 구매',
      'online shopping product purchase cart checkout',
    ],
  },
  {
    id: 'development',
    name: '개발',
    representativeTexts: [
      'GitHub 코드 리뷰',
      'Stack Overflow 질문 검색',
      'npm 패키지 찾기',
      'API 문서 읽기',
      '개발자 블로그',
      'github stackoverflow documentation API developer programming code',
    ],
  },
  {
    id: 'finance',
    name: '금융',
    representativeTexts: [
      '주식 시세 확인',
      '은행 업무',
      '투자 정보',
      '암호화폐 거래',
      '금융 뉴스',
      'stock investment banking cryptocurrency finance trading',
    ],
  },
  {
    id: 'health',
    name: '건강',
    representativeTexts: [
      '운동 루틴 찾기',
      '건강 정보 검색',
      '다이어트 식단',
      '명상 가이드',
      '의료 정보',
      'exercise fitness health diet wellness medical',
    ],
  },
  {
    id: 'etc',
    name: '기타',
    representativeTexts: [
      '일반 검색',
      '기타 웹사이트',
      '다양한 주제',
      'miscellaneous various general',
    ],
  },
];

/**
 * ML 분류기 설정값
 */
export const ML_CLASSIFIER_CONFIG = {
  // 분류 신뢰도 임계값 (0~1 사이 값)
  // 이 값보다 낮은 신뢰도는 '기타'로 분류
  CLASSIFICATION_THRESHOLD: 0.5,

  // 임베딩 캐시 TTL (초 단위)
  EMBEDDING_CACHE_TTL: 3600, // 1시간

  // 배치 처리 최대 크기
  MAX_BATCH_SIZE: 100,
};
