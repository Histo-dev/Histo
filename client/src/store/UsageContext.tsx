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
  dataRangeDays?: number; // 데이터가 커버하는 일수
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

const BACKEND_URL = "http://localhost:3000";

// 백엔드 API에서 데이터 가져오기
const fetchFromBackend = async (): Promise<UsageState | null> => {
  try {
    // JWT 토큰 가져오기
    const { jwtToken } = await new Promise<{ jwtToken?: string }>((resolve) => {
      chrome.storage.local.get(["jwtToken"], (result) => resolve(result));
    });

    if (!jwtToken) {
      console.log("[histo] no JWT token, skip backend fetch");
      return null;
    }

    // 로컬 siteStats, dailyHistory 함께 가져오기
    const localStorage = await new Promise<any>((resolve) => {
      chrome.storage.local.get(["siteStats", "dailyHistory"], (result) =>
        resolve(result)
      );
    });

    // 카테고리 통계 가져오기
    const response = await fetch(`${BACKEND_URL}/history/stats/category`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("[histo] backend data:", data);

    // 백엔드 응답 형식: { categoryId, categoryName, totalTime, count }[]
    const categoryStats: CategoryStat[] = data.map((cat: any) => ({
      name: cat.categoryName || "기타",
      minutes: Math.round((cat.totalTime || 0) / 60), // 초 → 분
      visits: cat.count || 0,
      sites: 1, // 카테고리당 사이트 수는 별도 집계 필요
    }));

    const totalTimeMinutes = categoryStats.reduce(
      (sum, cat) => sum + cat.minutes,
      0
    );
    const totalVisits = categoryStats.reduce((sum, cat) => sum + cat.visits, 0);

    // 로컬 siteStats 변환
    const siteStatsObj = localStorage?.siteStats || {};
    const siteStats = Object.values(siteStatsObj) as SiteStat[];

    // 데이터 범위 계산 (로컬 스토리지에서 가져오기)
    const dailyHistory = localStorage?.dailyHistory || {};
    const dates = Object.keys(dailyHistory);
    const dataRangeDays = dates.length;

    const result = {
      totalTimeMinutes,
      totalSites: categoryStats.length, // 카테고리 개수
      totalVisits,
      siteStats, // 로컬 데이터 사용
      categoryStats,
      analysisState: "backend",
      loading: false,
      dataRangeDays, // 데이터가 있는 날짜 수
    };

    console.log("[histo] transformed backend data:", result);
    return result;
  } catch (error) {
    console.error("[histo] failed to fetch from backend:", error);
    return null;
  }
};

const convertStorageToState = (storage: Record<string, any>): UsageState => {
  const siteStats = storage.siteStats ?? {};
  const categoryStats = storage.categoryStats ?? {};
  const dailyTotals = storage.dailyTotals ?? {};
  const dailyHistory = storage.dailyHistory ?? {};

  const siteStatsArray = Object.values(siteStats) as SiteStat[];
  const categoryStatsArray = Object.values(categoryStats) as CategoryStat[];

  // 데이터 범위 계산
  const dates = Object.keys(dailyHistory);
  const dataRangeDays = dates.length;

  return {
    totalTimeMinutes: dailyTotals.totalMinutes ?? 0,
    totalSites: dailyTotals.totalSites ?? 0,
    totalVisits: dailyTotals.totalVisits ?? 0,
    siteStats: siteStatsArray,
    categoryStats: categoryStatsArray,
    analysisState: storage.analysisState ?? "idle",
    loading: false,
    dailyHistory: dailyHistory,
    dataRangeDays,
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
        // 1️⃣ 먼저 백엔드에서 데이터 가져오기 시도
        const backendData = await fetchFromBackend();
        console.log("[histo] fetchFromBackend result:", backendData);

        if (backendData) {
          console.log("[histo] ✅ using backend data", {
            categories: backendData.categoryStats.length,
            totalTime: backendData.totalTimeMinutes,
            totalVisits: backendData.totalVisits,
          });
          setState(backendData);
          return;
        }

        // 2️⃣ 백엔드 실패 시 로컬 스토리지 사용
        console.log("[histo] falling back to local storage");
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

        // Background에 데이터 요청 (비동기)
        if (chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage({ action: "get-data" }, () => {
            if (chrome.runtime.lastError) {
              // 무시
            }
          });
        }

        // 로컬 데이터 사용
        const siteStats = storageData?.siteStats ?? {};
        const totalMinutes = storageData?.dailyTotals?.totalMinutes ?? 0;
        const hasSiteStats = Object.keys(siteStats).length > 0;

        if (hasSiteStats || totalMinutes > 0) {
          setState(convertStorageToState(storageData));
        } else {
          // 데이터가 전혀 없으면 데모 사용
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
