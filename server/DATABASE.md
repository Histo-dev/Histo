# 데이터베이스 구성

## 개요

Histo 프로젝트는 SQLite + TypeORM을 사용하여 데이터를 관리합니다.

## 엔티티 구조

### 1. User (사용자)
```typescript
{
  id: string (UUID)
  name: string
  email: string (unique)
  createdAt: Date
}
```

### 2. Category (카테고리)
```typescript
{
  id: string (UUID)
  name: string (unique)
}
```

**기본 카테고리:**
- work (업무)
- study (학습)
- entertainment (엔터테인먼트)
- social (소셜)
- news (뉴스)
- shopping (쇼핑)
- development (개발)
- finance (금융)
- health (건강)
- etc (기타)

### 3. History (히스토리)
```typescript
{
  id: string (UUID)
  userId: string (FK -> User.id)
  categoryId: string (FK -> Category.id)
  url: string
  title: string
  meta: string (nullable)
  useTime: number (초 단위)
  visitedAt: Date
}
```

### 4. User_Category (사용자별 카테고리 알림 설정)
```typescript
{
  id: string (UUID)
  userId: string (FK -> User.id)
  categoryId: string (FK -> Category.id)
  alertTime: number (분 단위)
  createdAt: Date
}
```

예: "유저가 '엔터테인먼트' 카테고리에 30분 이상 머물면 알림"

### 5. User_Domain_Alert (사용자별 도메인 알림 설정)
```typescript
{
  id: string (UUID)
  userId: string (FK -> User.id)
  host: string (도메인, 예: "youtube.com")
  alertTime: number (분 단위)
  createdAt: Date
}
```

예: "유저가 'youtube.com'에 20분 이상 머물면 알림"

## 관계도

```
User (1) ──────── (N) History
User (1) ──────── (N) User_Category
User (1) ──────── (N) User_Domain_Alert
Category (1) ─── (N) History
Category (1) ─── (N) User_Category
```

## 데이터 시딩

서버 시작 시 자동으로:
1. 기본 10개 카테고리 생성 (없을 경우)
2. ML 분류기 카테고리 임베딩 초기화

[SeedService](server/src/database/seed.service.ts)에서 처리됩니다.

## 데이터베이스 파일

- 위치: `/server/histo.db`
- 타입: SQLite
- 개발 환경: `synchronize: true` (자동 스키마 동기화)
- 프로덕션: `synchronize: false` + 마이그레이션 사용 권장

## 사용 예시

### 엔티티 사용하기

```typescript
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History } from './entities';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private historyRepo: Repository<History>,
  ) {}

  async saveHistory(data: CreateHistoryDto) {
    const history = this.historyRepo.create(data);
    return await this.historyRepo.save(history);
  }
}
```

## TypeORM 쿼리 예시

### 가장 많이 방문한 사이트 Top 5
```typescript
const topSites = await historyRepo
  .createQueryBuilder('history')
  .select('history.url, COUNT(*) as visitCount')
  .where('history.userId = :userId', { userId })
  .groupBy('history.url')
  .orderBy('visitCount', 'DESC')
  .limit(5)
  .getRawMany();
```

### 카테고리별 사용 시간
```typescript
const categoryStats = await historyRepo
  .createQueryBuilder('history')
  .select('category.name, SUM(history.useTime) as totalTime')
  .leftJoin('history.category', 'category')
  .where('history.userId = :userId', { userId })
  .groupBy('category.id')
  .getRawMany();
```

## 다음 단계

- 히스토리 저장 API 구현
- 통계 조회 API 구현
- 알림 설정 API 구현
