// Background service worker for Histo
// Collects visits/sessions, aggregates stats, exposes simple analysis state
declare const chrome: typeof import("chrome");

type VisitSource = "history" | "tab_update" | "focus" | "blur";

type Visit = {
  id?: string;
  url: string;
  title?: string;
  ts: number;
  source: VisitSource;
};

type Session = {
  id: string;
  url: string;
  domain: string;
  start: number;
  end?: number;
  durationMs?: number;
  tabId?: number;
  windowId?: number;
};

type SiteStat = {
  domain: string;
  titleSample?: string;
  minutes: number;
  visits: number;
  category?: string;
  lastVisited: number;
  pctOfDay?: number;
};

type CategoryStat = {
  name: string;
  minutes: number;
  visits: number;
  sites: number;
};

type DailyTotal = {
  date: string;
  totalMinutes: number;
  totalSites: number;
  totalVisits: number;
};

type HistoryRecord = {
  [date: string]: DailyTotal;
};

const MAX_VISITS = 1000;
const MAX_SESSIONS = 500;
const DAY_KEY = () => new Date().toISOString().slice(0, 10);

const randomId = () =>
  crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

const storageGet = <T = any>(
  keys?: string[] | string | Record<string, any>
): Promise<T> =>
  new Promise((resolve) =>
    chrome.storage.local.get(keys ?? null, (res) => resolve(res as T))
  );

const storageSet = (data: Record<string, any>) =>
  new Promise<void>((resolve) =>
    chrome.storage.local.set(data, () => resolve())
  );

const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
};

const appendVisit = async (visit: Visit) => {
  const data = await storageGet<{ visits?: Visit[] }>({ visits: [] });
  const visits = (data.visits ?? []) as Visit[];
  visits.push(visit);
  if (visits.length > MAX_VISITS) visits.splice(0, visits.length - MAX_VISITS);
  await storageSet({ visits });
};

const appendSession = async (session: Session) => {
  const data = await storageGet<{ sessions?: Session[] }>({ sessions: [] });
  const sessions = (data.sessions ?? []) as Session[];
  sessions.push(session);
  if (sessions.length > MAX_SESSIONS)
    sessions.splice(0, sessions.length - MAX_SESSIONS);
  await storageSet({ sessions });
};

// Save daily totals to history archive
const archiveDailyData = async (dailyTotal: DailyTotal) => {
  const data = await storageGet<{ dailyHistory?: HistoryRecord }>({
    dailyHistory: {},
  });
  const dailyHistory = (data.dailyHistory ?? {}) as HistoryRecord;
  dailyHistory[dailyTotal.date] = dailyTotal;
  await storageSet({ dailyHistory });
  console.log("[histo] archived daily data:", dailyTotal);
};

// Check if date changed and reset if needed
const checkAndResetIfNewDay = async () => {
  const data = await storageGet<{ lastDate?: string }>();
  const currentDate = DAY_KEY();
  const lastDate = data.lastDate;

  if (lastDate && lastDate !== currentDate) {
    // Date changed, archive previous day's data and reset
    const {
      siteStats = {},
      categoryStats = {},
      dailyTotals = null,
    } = await storageGet<{
      siteStats?: Record<string, SiteStat>;
      categoryStats?: Record<string, CategoryStat>;
      dailyTotals?: DailyTotal;
    }>(["siteStats", "categoryStats", "dailyTotals"]);

    // Archive previous day if it has data
    if (dailyTotals && dailyTotals.totalMinutes > 0) {
      await archiveDailyData(dailyTotals);
    }

    // Reset current data
    await storageSet({
      sessions: [],
      visits: [],
      siteStats: {},
      categoryStats: {},
      processedSessionIds: [],
      dailyTotals: {
        date: currentDate,
        totalMinutes: 0,
        totalSites: 0,
        totalVisits: 0,
      },
      lastDate: currentDate,
    });
    console.log("[histo] new day detected, data reset");
  }

  // Update lastDate if not set
  if (!lastDate) {
    await storageSet({ lastDate: currentDate });
  }
};

const categorize = (
  domain: string,
  title?: string,
  categoryMap?: Record<string, string>
): string => {
  if (categoryMap?.[domain]) return categoryMap[domain];
  const t = `${domain} ${title ?? ""}`.toLowerCase();
  if (t.includes("youtube") || t.includes("netflix") || t.includes("video"))
    return "동영상";
  if (
    t.includes("facebook") ||
    t.includes("instagram") ||
    t.includes("twitter") ||
    t.includes("x.com")
  )
    return "소셜";
  if (
    t.includes("docs") ||
    t.includes("notion") ||
    t.includes("github") ||
    t.includes("gitlab") ||
    t.includes("bitbucket") ||
    t.includes("stackoverflow") ||
    t.includes("jira") ||
    t.includes("slack") ||
    t.includes("vscode")
  )
    return "업무";
  if (t.includes("news")) return "뉴스";
  if (t.includes("shopping") || t.includes("shop") || t.includes("store"))
    return "쇼핑";
  return "기타";
};

const aggregateAndStore = async () => {
  console.log("[histo] aggregateAndStore starting");
  try {
    // Check if date changed and reset if needed
    await checkAndResetIfNewDay();

    const {
      sessions = [],
      visits = [],
      categoryMap = {},
      siteStats: existingSiteStats = {},
      categoryStats: existingCategoryStats = {},
      processedSessionIds = [],
    } = await storageGet<{
      sessions: Session[];
      visits: Visit[];
      categoryMap?: Record<string, string>;
      siteStats?: Record<string, SiteStat>;
      categoryStats?: Record<string, CategoryStat>;
      processedSessionIds?: string[];
    }>([
      "sessions",
      "visits",
      "categoryMap",
      "siteStats",
      "categoryStats",
      "processedSessionIds",
    ]);

    console.log("[histo] loaded data:", {
      sessionsCount: sessions?.length || 0,
      processedCount: processedSessionIds?.length || 0,
      siteStatsCount: Object.keys(existingSiteStats || {}).length,
    });

    // Include current session in calculation but don't modify it
    let allSessions = [...sessions];
    if (currentSession) {
      const end = Date.now();
      const durationMs = Math.max(0, end - currentSession.start);
      allSessions.push({
        ...currentSession,
        end,
        durationMs,
      } as Session);
    }

    if (!Array.isArray(allSessions) || allSessions.length === 0) {
      await storageSet({
        siteStats: existingSiteStats,
        categoryStats: existingCategoryStats,
        dailyTotals: {
          date: DAY_KEY(),
          totalMinutes: Object.values(existingSiteStats).reduce(
            (sum, s) => sum + (s.minutes || 0),
            0
          ),
          totalSites: Object.keys(existingSiteStats).length,
          totalVisits: visits.length,
        } satisfies DailyTotal,
        analysisState: "idle",
        lastAggregatedAt: Date.now(),
      });
      return;
    }

    // Start with existing stats
    const siteStats: Record<string, SiteStat> = JSON.parse(
      JSON.stringify(existingSiteStats || {})
    );
    const categoryStats: Record<string, CategoryStat> = JSON.parse(
      JSON.stringify(existingCategoryStats || {})
    );

    let totalMinutes = 0;
    let newProcessedIds = [...(processedSessionIds || [])];

    // Only process NEW sessions
    let newSessionsCount = 0;
    allSessions.forEach((s) => {
      if (newProcessedIds.includes(s.id)) {
        // Already processed, skip
        return;
      }

      const durationMs = s.durationMs ?? (s.end ? s.end - s.start : 0);
      const minutes = Math.max(0, durationMs) / 60000;
      totalMinutes += minutes;
      const domain = s.domain;

      if (!siteStats[domain]) {
        siteStats[domain] = {
          domain,
          minutes: 0,
          visits: 0,
          lastVisited: s.end ?? s.start,
        };
      }
      siteStats[domain].minutes += minutes;
      siteStats[domain].visits += 1;
      siteStats[domain].lastVisited = Math.max(
        siteStats[domain].lastVisited,
        s.end ?? s.start
      );

      const cat = categorize(
        domain,
        s.url,
        categoryMap as Record<string, string>
      );
      siteStats[domain].category = cat;

      if (!categoryStats[cat])
        categoryStats[cat] = { name: cat, minutes: 0, visits: 0, sites: 0 };
      categoryStats[cat].minutes += minutes;
      categoryStats[cat].visits += 1;

      // Mark this session as processed
      newProcessedIds.push(s.id);
      newSessionsCount++;
    });

    console.log(
      "[histo] processed sessions:",
      newSessionsCount,
      "new processedIds count:",
      newProcessedIds.length
    );
    // Calculate total minutes from final siteStats (all accumulated data)
    totalMinutes = 0;
    Object.values(siteStats).forEach((s) => {
      totalMinutes += s.minutes || 0;
    });

    // Round totalMinutes first to use accurate total for percentage calculation
    const roundedTotalMinutes = Math.round(totalMinutes);

    Object.values(siteStats).forEach((s) => {
      s.minutes = Math.round(s.minutes);
      s.pctOfDay = roundedTotalMinutes
        ? Math.round((s.minutes / roundedTotalMinutes) * 1000) / 10
        : 0;
    });
    Object.values(categoryStats).forEach((c) => {
      c.minutes = Math.round(c.minutes);
      c.sites = Object.values(siteStats).filter(
        (s) => s.category === c.name
      ).length;
    });

    // Recalculate category stats from siteStats to ensure consistency
    const finalCategoryStats: Record<string, CategoryStat> = {};
    Object.values(siteStats).forEach((s) => {
      if (!s.category) return;
      if (!finalCategoryStats[s.category]) {
        finalCategoryStats[s.category] = {
          name: s.category,
          minutes: 0,
          visits: 0,
          sites: 0,
        };
      }
      finalCategoryStats[s.category].minutes += s.minutes || 0;
      finalCategoryStats[s.category].visits += s.visits || 0;
    });
    // Count unique sites per category
    Object.values(finalCategoryStats).forEach((c) => {
      c.sites = Object.values(siteStats).filter(
        (s) => s.category === c.name
      ).length;
    });

    const dailyTotals: DailyTotal = {
      date: DAY_KEY(),
      totalMinutes: roundedTotalMinutes,
      totalSites: Object.keys(siteStats).length,
      totalVisits: visits.length,
    };

    await storageSet({
      siteStats,
      categoryStats: finalCategoryStats,
      dailyTotals,
      processedSessionIds: newProcessedIds,
      // Keep sessions - they accumulate throughout the day
      // Only cleared on daily reset
      analysisState: "idle",
      lastAggregatedAt: Date.now(),
    });
    console.log("[histo] aggregateAndStore completed successfully", {
      totalMinutes: roundedTotalMinutes,
      siteCount: Object.keys(siteStats).length,
      processedIdsSaved: newProcessedIds.length,
    });
  } catch (err) {
    console.error("[histo] aggregateAndStore error:", err);
    throw err;
  }
};

let currentSession: Session | null = null;

const endSession = async (reason: string) => {
  if (!currentSession) return;
  const end = Date.now();
  const durationMs = Math.max(0, end - currentSession.start);
  const session: Session = { ...currentSession, end, durationMs };
  currentSession = null;
  await appendSession(session);
  console.log("[histo] session ended", reason, session);

  // Schedule aggregation asynchronously (don't wait for it)
  // This prevents blocking and service worker termination
  aggregateAndStore().catch((err) => {
    console.error("[histo] delayed aggregateAndStore failed:", err);
  });
};

const startSession = async (
  url?: string,
  tabId?: number,
  windowId?: number
) => {
  if (!url) return;
  await endSession("switch");
  const domain = getDomain(url);
  currentSession = {
    id: randomId(),
    url,
    domain,
    start: Date.now(),
    tabId,
    windowId,
  };
  console.log("[histo] session started", domain);
};

// Event wiring
chrome.history?.onVisited?.addListener((item) => {
  appendVisit({
    id: item.id,
    url: item.url ?? "",
    title: item.title,
    ts: Date.now(),
    source: "history",
  }).catch(console.error);
});

chrome.tabs?.onUpdated?.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    appendVisit({
      url: tab.url,
      title: tab.title,
      ts: Date.now(),
      source: "tab_update",
    }).catch(console.error);
    if (tab.active)
      startSession(tab.url, tabId, tab.windowId).catch(console.error);
  }
});

chrome.tabs?.onActivated?.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    if (tab?.url)
      startSession(tab.url, activeInfo.tabId, tab.windowId).catch(
        console.error
      );
  });
});

chrome.tabs?.onRemoved?.addListener((tabId) => {
  if (currentSession?.tabId === tabId)
    endSession("tab-removed").catch(console.error);
});

chrome.windows?.onFocusChanged?.addListener((winId) => {
  if (winId === chrome.windows.WINDOW_ID_NONE) {
    endSession("window-blur").catch(console.error);
  }
});

chrome.idle?.onStateChanged?.addListener((newState) => {
  if (newState === "idle" || newState === "locked") {
    endSession(`idle-${newState}`).catch(console.error);
  }
});

chrome.runtime.onInstalled?.addListener(() => {
  console.log("Histo background installed");
  const currentDate = DAY_KEY();
  storageSet({
    analysisState: "idle",
    lastDate: currentDate,
    dailyHistory: {},
    dailyTotals: {
      date: currentDate,
      totalMinutes: 0,
      totalSites: 0,
      totalVisits: 0,
    },
  });
});

chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
  if (msg?.action === "start-analysis") {
    console.log("[histo] start-analysis request");
    // Always aggregate and store current data before responding
    aggregateAndStore()
      .then(() => {
        console.log("[histo] start-analysis complete");
        sendResponse({ ok: true });
      })
      .catch((err) => {
        console.error("[histo] start-analysis error:", err);
        sendResponse({ ok: false, error: (err as Error)?.message });
      });
    return true;
  }

  if (msg?.action === "get-data") {
    console.log("[histo] get-data request");

    // Immediately send response
    try {
      sendResponse({ ok: true, data: null });
      console.log("[histo] sendResponse called");
    } catch (e) {
      console.error("[histo] sendResponse error:", e);
    }

    // Then trigger aggregation in background
    aggregateAndStore().catch((err) => {
      console.error("[histo] background aggregation failed:", err);
    });

    return false; // Response already sent
  }

  return undefined;
});

// Initialize: set up periodic aggregation
console.log("[histo] background script loaded");
chrome.alarms.create("aggregate", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "aggregate") {
    console.log("[histo] alarm triggered, aggregating");
    aggregateAndStore().catch(console.error);
  }
});

// Expose functions for console debugging
(globalThis as any).histoDebug = {
  testAggregate: () => aggregateAndStore(),
  checkStorage: () =>
    storageGet(["siteStats", "processedSessionIds", "sessions"]).then(
      (data) => {
        console.log("[debug] storage:", {
          sessions: data.sessions?.length || 0,
          processed: data.processedSessionIds?.length || 0,
          minutes: Object.values(data.siteStats || {}).reduce(
            (s, x: any) => s + (x.minutes || 0),
            0
          ),
        });
        return data;
      }
    ),
};
console.log("[histo] debug functions available at window.histoDebug");
