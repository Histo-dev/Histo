import { create } from 'zustand'

declare const chrome: any

export type SiteStat = {
  domain: string
  titleSample?: string
  minutes: number
  visits: number
  category?: string
  lastVisited: number
  pctOfDay?: number
}

export type CategoryStat = {
  name: string
  minutes: number
  visits: number
  sites: number
  trend?: number
}

export type DailyTotals = {
  date: string
  totalMinutes: number
  totalSites: number
  totalVisits: number
}

type UsageState = {
  totalTimeMinutes: number
  totalSites: number
  totalVisits: number
  siteStats: SiteStat[]
  categoryStats: CategoryStat[]
  analysisState?: string
  loading: boolean
  fetchFromStorage: () => Promise<void>
}

export type { UsageState }

const defaultTotals: DailyTotals = {
  date: '',
  totalMinutes: 0,
  totalSites: 0,
  totalVisits: 0,
}

let inflightFetch: Promise<void> | null = null

export const useUsageStore = create<UsageState>((set) => ({
  totalTimeMinutes: 0,
  totalSites: 0,
  totalVisits: 0,
  siteStats: [],
  categoryStats: [],
  analysisState: 'idle',
  loading: false,

  fetchFromStorage: async (): Promise<void> => {
    // guard for dev server without chrome extension context
    if (typeof chrome === 'undefined' || !chrome?.storage?.local) {
      set({
        totalTimeMinutes: 270,
        totalSites: 24,
        totalVisits: 0,
        siteStats: [],
        categoryStats: [],
        analysisState: 'demo',
        loading: false,
      })
      return
    }

    // prevent re-entrant loops when storage change events fire rapidly
    if (inflightFetch) return inflightFetch

    inflightFetch = (async () => {
      set({ loading: true })
      const data = await new Promise<{
        siteStats?: Record<string, SiteStat>
        categoryStats?: Record<string, CategoryStat>
        dailyTotals?: DailyTotals
        analysisState?: string
      }>((resolve) => {
        chrome.storage.local.get(
          ['siteStats', 'categoryStats', 'dailyTotals', 'analysisState'],
          (res: {
            siteStats?: Record<string, SiteStat>
            categoryStats?: Record<string, CategoryStat>
            dailyTotals?: DailyTotals
            analysisState?: string
          }) => resolve(res),
        )
      })

      const siteStats = Object.values(data.siteStats ?? {}).sort((a, b) => b.minutes - a.minutes)
      const categoryStats = Object.values(data.categoryStats ?? {}).sort((a, b) => b.minutes - a.minutes)
      const totals = data.dailyTotals ?? defaultTotals

      set({
        totalTimeMinutes: totals.totalMinutes,
        totalSites: totals.totalSites,
        totalVisits: totals.totalVisits,
        siteStats,
        categoryStats,
        analysisState: data.analysisState ?? 'idle',
        loading: false,
      })
    })().finally(() => {
      inflightFetch = null
    })

    return inflightFetch
  },
}))

export default useUsageStore
