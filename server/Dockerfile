# Build stage
FROM node:20-alpine AS builder

# pnpm 설치
RUN npm install -g pnpm@10.6.4

# 작업 디렉토리 설정
WORKDIR /app

# Python과 build dependencies 설치 (tensorflow 빌드를 위해)
RUN apk add --no-cache python3 make g++

# package.json과 pnpm-lock.yaml 복사
COPY package.json pnpm-lock.yaml ./

# 의존성 설치
RUN pnpm install --frozen-lockfile

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

# pnpm 설치
RUN npm install -g pnpm@10.6.4

# 작업 디렉토리 설정
WORKDIR /app

# Python과 runtime dependencies 설치 (tensorflow runtime을 위해)
RUN apk add --no-cache python3 make g++

# package.json과 pnpm-lock.yaml 복사
COPY package.json pnpm-lock.yaml ./

# 프로덕션 의존성만 설치
RUN pnpm install --frozen-lockfile --prod

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist

# 포트 노출
EXPOSE 3000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 프로덕션 모드로 실행
CMD ["pnpm", "run", "start:prod"]
