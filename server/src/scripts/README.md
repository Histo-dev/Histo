# Database Seeding Scripts

## Category Seeding Script

프로덕션 환경에서 기본 카테고리를 수동으로 생성하는 스크립트입니다.

### 사용 방법

#### 1. 의존성 설치 (처음 한 번만)

```bash
pnpm install
```

#### 2. 스크립트 실행

```bash
# 개발 환경
pnpm seed:categories

# 프로덕션 환경 (.env 설정 확인 필요)
NODE_ENV=production pnpm seed:categories
```

#### 3. 강제 실행 (이미 카테고리가 있어도 실행)

```bash
pnpm seed:categories -- --force
```

### 생성되는 카테고리

1. 업무
2. 학습
3. 개발
4. 엔터테인먼트
5. 소셜미디어
6. 쇼핑
7. 뉴스
8. 기타

### 주의사항

- 이미 존재하는 카테고리는 건너뜁니다
- `--force` 플래그 없이는 카테고리가 이미 있을 때 경고를 표시합니다
- 실행 전 `.env` 파일의 데이터베이스 설정을 확인하세요

### 프로덕션 배포 시

```bash
# 1. 빌드
pnpm build

# 2. 프로덕션 환경 변수 설정
export NODE_ENV=production
export DB_HOST=your-supabase-host
export DB_PORT=5432
export DB_NAME=postgres
export DB_USERNAME=postgres
export DB_PASSWORD=your-password

# 3. 스크립트 실행
pnpm seed:categories
```

### 트러블슈팅

#### "Cannot find module" 에러

```bash
# ts-node가 설치되지 않은 경우
pnpm add -D ts-node tsconfig-paths
```

#### 데이터베이스 연결 실패

`.env` 파일의 데이터베이스 설정을 확인하세요:

```env
DB_HOST=your-supabase-host.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=your-password
```
