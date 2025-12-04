# HISTO Backend API

크롬 히스토리 분석 및 관리 백엔드 서버

## 기능

- 🤖 ML 기반 자동 카테고리 분류 (TensorFlow.js)
- 📊 히스토리 통계 및 분석
- ⏰ 사용 시간 알림 설정
- 💡 패턴 분석 기반 조언 생성
- 📈 시간대별/카테고리별 사용 패턴 시각화

## 기술 스택

- **Framework**: NestJS
- **Database**: SQLite (sql.js)
- **ML**: TensorFlow.js + Universal Sentence Encoder
- **ORM**: TypeORM
- **Validation**: class-validator
- **Documentation**: Swagger

## 설치
```bash
# 패키지 설치
pnpm install

# 환경변수 설정
cp .env.example .env

# 개발 서버 실행
pnpm run start:dev
```

## API 문서

서버 실행 후 http://localhost:3000/api-docs 에서 확인

## 주요 엔드포인트

### 사용자 관리
- `POST /users` - 사용자 생성
- `GET /users` - 사용자 목록
- `GET /users/:id` - 사용자 조회

### 히스토리 관리
- `POST /history` - 히스토리 생성 (자동 분류)
- `POST /history/batch` - 일괄 생성
- `GET /history` - 히스토리 조회
- `GET /history/stats/category/:userId` - 카테고리별 통계
- `GET /history/stats/top-visited/:userId` - 많이 방문한 사이트
- `GET /history/stats/hourly/:userId` - 시간대별 통계

### ML 분류
- `POST /ml/classify` - 단일 페이지 분류
- `POST /ml/classify/batch` - 일괄 분류

### 알림
- `POST /alerts/category` - 카테고리 알림 설정
- `POST /alerts/domain` - 도메인 알림 설정
- `GET /alerts/check/category` - 알림 체크

### 조언
- `GET /advice/weekly/:userId` - 주간 패턴 분석
- `GET /advice/daily/:userId` - 일일 요약

### 헬스체크
- `GET /health` - 서버 상태
- `GET /health/ready` - 준비 상태

## 프로젝트 구조
```
src/
├── common/              # 공통 모듈
│   ├── filters/        # 예외 필터
│   ├── interceptors/   # 인터셉터
│   └── seeder/         # 데이터 시딩
├── config/             # 설정
├── entities/           # TypeORM 엔티티
└── modules/            # 기능 모듈
    ├── user/
    ├── category/
    ├── history/
    ├── ml/
    ├── alert/
    ├── advice/
    └── health/
```

## 환경변수
```env
NODE_ENV=development
PORT=3000
DATABASE_PATH=./data/histo.db
```

## 라이센스

MIT