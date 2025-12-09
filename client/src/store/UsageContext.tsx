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
  dailyHistory?: Record<string, DailyTotals>;
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
  dailyHistory: {},
};

const UsageContext = createContext<UsageState>(defaultState);

const convertStorageToState = (storage: Record<string, any>): UsageState => {
  const siteStats = storage.siteStats ?? {};
  const categoryStats = storage.categoryStats ?? {};
  const dailyTotals = storage.dailyTotals ?? {};
  const dailyHistory = storage.dailyHistory ?? {};

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
    dailyHistory: dailyHistory,
  };
};

export const UsageProvider = ({
  children,
  triggerRefresh = 0,
}: {
  children: ReactNode;
  triggerRefresh?: number;
}) => {
  const [state, setState] = useState<UsageState>(defaultState);

  useEffect(() => {
    const loadData = async () => {
      if (typeof chrome === "undefined" || !chrome.runtime) {
        setState(demoState);
        return;
      }

      try {
        // First, try to load from local storage immediately
        const storageData = await new Promise<any>((resolve) => {
          chrome.storage.local.get(
            [
              "siteStats",
              "categoryStats",
              "dailyTotals",
              "analysisState",
              "dailyHistory",
            ],
            (result) => {
              resolve(result);
            }
          );
        });

        console.log("[histo] loaded from storage:", storageData);

        // Then, request background to aggregate and update data
        // Note: This may fail if background worker isn't ready, but that's okay - we use storage data
        if (chrome.runtime?.sendMessage) {
          const response = await new Promise<any>((resolve) => {
            const timeout = setTimeout(() => {
              resolve(null);
            }, 2000);

            try {
              chrome.runtime.sendMessage({ action: "get-data" }, (response) => {
                clearTimeout(timeout);
                if (chrome.runtime.lastError) {
                  // Silently ignore - storage data is sufficient
                  resolve(null);
                } else {
                  resolve(response);
                }
              });
            } catch (err) {
              clearTimeout(timeout);
              resolve(null);
            }
          });

          if (response?.ok && response?.data) {
            console.log("[histo] got data from background:", response.data);
            setState(convertStorageToState(response.data));
            return;
          }
        }

        // Use storage data if background response failed
        const siteStats = storageData?.siteStats ?? {};
        const totalMinutes = storageData?.dailyTotals?.totalMinutes ?? 0;
        const hasSiteStats = Object.keys(siteStats).length > 0;

        if (hasSiteStats || totalMinutes > 0) {
          setState(convertStorageToState(storageData));
        } else {
          // Only use demo if no actual data at all
          setState(demoState);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setState(demoState);
      }
    };

    loadData();
  }, [triggerRefresh]);

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
