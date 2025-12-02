import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

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

const demoState: UsageState = {
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

const defaultState: UsageState = {
  totalTimeMinutes: 0,
  totalSites: 0,
  totalVisits: 0,
  siteStats: [],
  categoryStats: [],
  loading: true,
};

const UsageContext = createContext<UsageState>(defaultState);

const convertStorageToState = (storage: Record<string, any>): UsageState => {
  const siteStats = storage.siteStats ?? {};
  const categoryStats = storage.categoryStats ?? {};
  const dailyTotals = storage.dailyTotals ?? {};

  const siteStatsArray = Object.values(siteStats) as SiteStat[];
  const categoryStatsArray = Object.values(categoryStats) as CategoryStat[];

  return {
    totalTimeMinutes: dailyTotals.totalMinutes ?? 0,
    totalSites: dailyTotals.totalSites ?? 0,
    totalVisits: dailyTotals.totalVisits ?? 0,
    siteStats: siteStatsArray,
    categoryStats: categoryStatsArray,
    analysisState: storage.analysisState ?? "idle",
    loading: false,
  };
};

export const UsageProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<UsageState>(defaultState);

  useEffect(() => {
    const loadData = () => {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.get(
          ["siteStats", "categoryStats", "dailyTotals", "analysisState"],
          (result) => {
            if (chrome.runtime.lastError) {
              console.warn(
                "Failed to load storage, using demo data:",
                chrome.runtime.lastError
              );
              setState(demoState);
            } else {
              const hasData =
                Object.keys(result.siteStats ?? {}).length > 0 ||
                (result.dailyTotals?.totalMinutes ?? 0) > 0;

              if (hasData) {
                setState(convertStorageToState(result));
              } else {
                setState(demoState);
              }
            }
          }
        );
      } else {
        setState(demoState);
      }
    };

    loadData();
  }, []);

  return (
    <UsageContext.Provider value={state}>{children}</UsageContext.Provider>
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
