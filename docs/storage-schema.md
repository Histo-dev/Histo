# Chrome storage schema (Histo)

로컬 `chrome.storage.local`을 기준으로, 팝업/옵션/배경 스크립트가 공유하는 키와 구조 초안입니다.

## Raw data

- `visits: Visit[]` – 방문 이벤트 원본 목록 (최근 N개만 보관)
  - `id?: string` (history id), `url: string`, `title?: string`, `ts: number`(ms)
  - `source: 'history' | 'tab_update' | 'focus' | 'blur'`
- `sessions: Session[]` – 체류 시간 추정용 세션 기록
  - `id: string`, `url: string`, `domain: string`, `start: number`, `end?: number`, `durationMs?: number`
  - `activeTabId?: number`, `windowId?: number`

## Aggregated (일자별 스냅샷)

- `siteStats: Record<string, SiteStat>` – key: 도메인
  - `domain: string`, `titleSample?: string`, `minutes: number`, `visits: number`, `category?: string`
  - `lastVisited: number`, `pctOfDay?: number`
- `categoryStats: Record<string, CategoryStat>`
  - `name: string`, `minutes: number`, `visits: number`, `sites: number`, `trend?: number`(전일 대비 %)
- `dailyTotals: DailyTotal` – 일 단위 합계
  - `date: string`(YYYY-MM-DD), `totalMinutes: number`, `totalSites: number`, `totalVisits: number`

## Settings / config

- `alertRules: AlertRule[]`
  - `id: string`, `match: { domain?: string; category?: string }`, `thresholdMinutes: number`
  - `enabled: boolean`, `lastNotified?: number`
- `categoryMap: Record<string, string>` – 도메인 → 수동 카테고리 매핑

## Runtime state

- `analysisState: 'idle' | 'running' | 'error'`
- `analysisStartedAt?: number`, `analysisError?: string`
- `lastAggregatedAt?: number` – 집계 시점

## 보관/제한 전략

- `visits`/`sessions`는 최근 N(예: 1000)개로 제한.
- Aggregated는 날짜별 키(`siteStats:YYYY-MM-DD` 등)로 분리하거나 단일 키에 날짜 포함 필드로 저장하고, 오래된 일자는 주기적으로 정리.
