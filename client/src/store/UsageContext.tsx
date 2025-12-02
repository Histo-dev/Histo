import { createContext, useContext, type ReactNode } from "react";

export type SiteStat = {
  domain: string;
  titleSample?: string;
  minutes: number;
  visits: number;
  category?: string;
  lastVisited: number;
  pctOfDay?: number;
};

export type CategoryStat = {
  name: string;
  minutes: number;
  visits: number;
  sites: number;
  trend?: number;
};

export type DailyTotals = {
  date: string;
  totalMinutes: number;
  totalSites: number;
  totalVisits: number;
};

export type UsageState = {
  totalTimeMinutes: number;
  totalSites: number;
  totalVisits: number;
  siteStats: SiteStat[];
  categoryStats: CategoryStat[];
  analysisState?: string;
  loading: boolean;
};

const defaultState: UsageState = {
  totalTimeMinutes: 270,
  totalSites: 24,
  totalVisits: 0,
  siteStats: [
    {
      domain: "facebook.com",
      minutes: 120,
      visits: 5,
      lastVisited: Date.now(),
      category: "소셜",
    },
    {
      domain: "youtube.com",
      minutes: 85,
      visits: 3,
      lastVisited: Date.now(),
      category: "동영상",
    },
    {
      domain: "news.example",
      minutes: 45,
      visits: 2,
      lastVisited: Date.now(),
      category: "뉴스",
    },
  ],
  categoryStats: [
    { name: "소셜", minutes: 120, visits: 5, sites: 1 },
    { name: "동영상", minutes: 85, visits: 3, sites: 1 },
    { name: "뉴스", minutes: 45, visits: 2, sites: 1 },
  ],
  analysisState: "demo",
  loading: false,
};

const UsageContext = createContext<UsageState>(defaultState);

export const UsageProvider = ({ children }: { children: ReactNode }) => {
  return (
    <UsageContext.Provider value={defaultState}>
      {children}
    </UsageContext.Provider>
  );
};

export const useUsageStore = (): UsageState => {
  const context = useContext(UsageContext);
  if (!context) {
    return defaultState;
  }
  return context;
};

export default useUsageStore;
