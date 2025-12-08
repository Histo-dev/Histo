# Vercel 배포 가이드

## 배포 전 준비사항

### 1. Supabase 데이터베이스 설정

Supabase 프로젝트가 생성되어 있어야 합니다.

### 2. 로컬에서 프로덕션 DB에 카테고리 시딩

**중요**: Vercel은 서버리스 환경이므로 배포 전에 수동으로 시딩해야 합니다.

```bash
# .env 파일에 프로덕션 DB 정보 입력
DB_HOST=your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=your-password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# 카테고리 시딩
NODE_ENV=production pnpm seed:categories
```

## Vercel 배포

### 1. Vercel CLI 설치 (선택사항)

```bash
npm i -g vercel
```

### 2. Vercel 프로젝트 설정

#### 방법 A: Vercel Dashboard (추천)

1. https://vercel.com 로그인
2. "New Project" 클릭
3. GitHub 저장소 연결
4. Root Directory: `server` 선택
5. Build Command: `pnpm vercel-build`
6. Output Directory: `dist`
7. Install Command: `pnpm install`

#### 방법 B: CLI

```bash
cd /Users/yuna/Projects/Histo/server
vercel
```

### 3. 환경 변수 설정

Vercel Dashboard → Settings → Environment Variables에 추가:

```
NODE_ENV=production
DB_HOST=your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=your-password
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### 4. 배포

```bash
# 자동 배포 (GitHub push 시)
git push origin main

# 또는 수동 배포
vercel --prod
```

## 배포 후 확인

### 1. Health Check

```bash
curl https://your-app.vercel.app/health
```

### 2. 카테고리 확인

```bash
curl https://your-app.vercel.app/categories
```

## 트러블슈팅

### 문제 1: "Module not found" 에러

**해결**: `tsconfig-paths`가 빌드에 포함되었는지 확인

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 문제 2: 데이터베이스 연결 실패

**해결**:
1. Supabase에서 Vercel IP를 허용했는지 확인
2. 환경 변수가 올바르게 설정되었는지 확인

### 문제 3: 카테고리가 없음

**해결**: 로컬에서 프로덕션 DB에 수동 시딩 실행

```bash
NODE_ENV=production pnpm seed:categories
```

### 문제 4: Cold Start 시간이 김

**원인**: TensorFlow 등 무거운 라이브러리 로딩

**해결**:
- Vercel Pro 플랜 사용 (더 긴 실행 시간)
- 또는 ML 기능을 별도 서비스로 분리

## 주의사항

### Vercel 서버리스 제한사항

- **실행 시간**: 무료 10초, Pro 60초
- **메모리**: 무료 1GB, Pro 3GB
- **상태 없음**: 매 요청마다 새로운 인스턴스
- **파일 시스템**: 읽기 전용

### NestJS OnModuleInit

- 매 요청마다 실행될 수 있음
- 무거운 초기화는 피하기
- DB 연결은 재사용됨 (TypeORM이 자동 처리)

## 대안: Vercel 외 배포 옵션

TensorFlow 등 무거운 라이브러리 사용 시:

1. **Railway**: 컨테이너 기반, 제한 없음
2. **Render**: 무료 티어 제공
3. **Fly.io**: 전 세계 배포 가능
4. **AWS Lambda**: Vercel과 유사하지만 더 유연

## 참고 자료

- [Vercel + NestJS 공식 가이드](https://vercel.com/guides/deploying-nestjs-with-vercel)
- [Supabase 연결 가이드](https://supabase.com/docs/guides/database)
