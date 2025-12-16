// Background service worker for Histo
// Collects visits/sessions, aggregates stats, exposes simple analysis state
declare const chrome: typeof import("chrome");
declare const process: { env: Record<string, string | undefined> };

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
const CURRENT_SESSION_KEY = "currentSession";
const BACKEND_URL = (
  process.env.VITE_BACKEND_URL ?? "http://localhost:3000"
).replace(/\/$/, ""); // 백엔드 서버 URL
const SYNC_INTERVAL_MINUTES = 5; // 5분마다 동기화

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

const loadPersistedCurrentSession = async (): Promise<Session | null> => {
  const data = await storageGet<{ currentSession?: Session }>({
    [CURRENT_SESSION_KEY]: null,
  });
  return (data.currentSession as Session) ?? null;
};

const persistCurrentSession = async (session: Session | null) => {
  if (session) {
    await storageSet({ [CURRENT_SESSION_KEY]: session });
  } else {
    await storageSet({ [CURRENT_SESSION_KEY]: null });
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

    // 🆕 Sync to backend before reset (force full sync)
    console.log("[histo] syncing data to backend before daily reset");
    await syncToBackend(true).catch((err) =>
      console.error("[histo] failed to sync before daily reset:", err)
    );

    // Reset current data
    await storageSet({
      sessions: [],
      visits: [],
      siteStats: {},
      categoryStats: {},
      processedSessionIds: [],
      [CURRENT_SESSION_KEY]: null,
      dailyTotals: {
        date: currentDate,
        totalMinutes: 0,
        totalSites: 0,
        totalVisits: 0,
      },
      lastDate: currentDate,
      lastSyncedAt: null, // Reset sync timestamp
    });
    currentSession = null;
    console.log("[histo] new day detected, data reset");
  }

  // Update lastDate if not set
  if (!lastDate) {
    await storageSet({ lastDate: currentDate });
  }
};

// 🆕 Sync history data to backend
const syncToBackend = async (forceFull = false) => {
  try {
    // Get JWT token
    const { jwtToken } = await storageGet<{ jwtToken?: string }>(["jwtToken"]);
    if (!jwtToken) {
      console.log("[histo] skip sync: not logged in");
      return;
    }

    // Get sessions to upload
    const { sessions = [], lastSyncedAt } = await storageGet<{
      sessions?: Session[];
      lastSyncedAt?: number;
    }>(["sessions", "lastSyncedAt"]);

    // Filter sessions: if forceFull, sync all; otherwise only new ones
    const unsyncedSessions = sessions.filter(
      (s) =>
        s.end &&
        s.url &&
        s.url.startsWith("http") &&
        (forceFull || !lastSyncedAt || s.start > lastSyncedAt)
    );

    if (unsyncedSessions.length === 0) {
      console.log("[histo] no new sessions to sync");
      return;
    }

    // Convert sessions to backend format with validation
    const histories = unsyncedSessions
      .map((session, index) => {
        try {
          // Skip empty or invalid URLs
          if (!session.url || typeof session.url !== "string") {
            console.warn(`[histo] skipping empty URL at index ${index}`);
            return null;
          }

          // Validate URL format
          const urlObj = new URL(session.url);

          // Only allow http/https
          if (!urlObj.protocol.startsWith("http")) {
            console.warn(`[histo] skipping non-http URL: ${session.url}`);
            return null;
          }

          // Check if hostname exists and is valid
          if (!urlObj.hostname || urlObj.hostname === "") {
            console.warn(
              `[histo] skipping URL with no hostname: ${session.url}`
            );
            return null;
          }

          // Additional validation: ensure URL has proper structure
          // Allow localhost and IP addresses, or domains with dots
          const urlString = session.url.trim();
          const isLocalhostOrIP =
            urlObj.hostname === "localhost" ||
            urlObj.hostname.startsWith("127.") ||
            urlObj.hostname.startsWith("192.168.") ||
            /^\d+\.\d+\.\d+\.\d+$/.test(urlObj.hostname);

          if (
            !isLocalhostOrIP &&
            !urlString.match(/^https?:\/\/[^\/]+\.[^\/]+/)
          ) {
            console.warn(`[histo] skipping malformed URL: ${session.url}`);
            return null;
          }

          // Final validation: test with class-validator compatible regex
          // This mimics the backend @IsUrl() validator
          const urlPattern =
            /^(?:http|https):\/\/(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;
          if (!urlPattern.test(urlString)) {
            console.warn(
              `[histo] URL failed strict validation: ${session.url}`
            );
            return null;
          }

          return {
            url: urlString,
            title: session.domain || urlObj.hostname,
            useTime: session.durationMs
              ? Math.round(session.durationMs / 1000)
              : 0,
          };
        } catch (err) {
          console.warn(
            `[histo] invalid URL at index ${index}, skipping: ${session.url}`,
            err
          );
          return null;
        }
      })
      .filter((h) => h !== null) as Array<{
      url: string;
      title: string;
      useTime: number;
    }>;

    if (histories.length === 0) {
      console.log("[histo] no valid sessions to sync after filtering");
      return;
    }

    console.log(`[histo] syncing ${histories.length} sessions to backend...`);

    // Split into batches of 100 (increased from 50)
    const BATCH_SIZE = 100;
    const batches: (typeof histories)[] = [];
    for (let i = 0; i < histories.length; i += BATCH_SIZE) {
      batches.push(histories.slice(i, i + BATCH_SIZE));
    }

    console.log(
      `[histo] split into ${batches.length} batches, sending in parallel...`
    );

    // Send all batches in parallel using Promise.all
    const batchPromises = batches.map(async (batch, i) => {
      console.log(
        `[histo] sending batch ${i + 1}/${batches.length} (${
          batch.length
        } items)...`
      );

      const response = await fetch(`${BACKEND_URL}/history/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ histories: batch }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Log problematic URLs if validation fails
        if (response.status === 400) {
          console.error(
            `[histo] batch ${i + 1} validation failed. Sample URLs:`
          );
          batch.slice(0, 10).forEach((h, idx) => {
            console.log(`  [${idx}] ${h.url}`);
          });
        }
        throw new Error(
          `HTTP ${response.status} on batch ${i + 1}: ${errorText}`
        );
      }

      const result = await response.json();
      console.log(
        `[histo] batch ${i + 1}/${batches.length} successful:`,
        result
      );
      return result;
    });

    // Wait for all batches to complete
    await Promise.all(batchPromises);

    console.log(`[histo] all ${batches.length} batches synced successfully`);

    // Update last synced timestamp
    await storageSet({ lastSyncedAt: Date.now() });
  } catch (error) {
    console.error("[histo] sync failed:", error);
    throw error;
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

    // Restore persisted in-progress session if service worker restarted
    if (!currentSession) {
      currentSession = await loadPersistedCurrentSession();
      if (currentSession) {
        console.log(
          "[histo] restored in-progress session from storage",
          currentSession.domain
        );
      }
    }

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

    // Clean processedSessionIds: only keep IDs that are still in current sessions
    const currentSessionIds = new Set(sessions.map((s) => s.id));
    const validProcessedIds = (processedSessionIds || []).filter((id) =>
      currentSessionIds.has(id)
    );

    if (validProcessedIds.length < (processedSessionIds?.length || 0)) {
      console.log(
        "[histo] trimmed processedIds:",
        validProcessedIds.length,
        "from",
        processedSessionIds?.length
      );
    }

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
    let newProcessedIds = [...validProcessedIds]; // Use cleaned processedIds

    // Only process NEW sessions
    let newSessionsCount = 0;
    let totalNewMinutes = 0;
    const processedSessionDetails = [];

    allSessions.forEach((s) => {
      if (newProcessedIds.includes(s.id)) {
        // Already processed, skip
        return;
      }

      const durationMs = s.durationMs ?? (s.end ? s.end - s.start : 0);
      const minutes = Math.max(0, durationMs) / 60000;
      totalNewMinutes += minutes;
      totalMinutes += minutes;
      const domain = s.domain;

      processedSessionDetails.push({
        domain,
        durationMs,
        minutes: Math.round(minutes * 100) / 100,
      });

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
      newProcessedIds.length,
      "new minutes:",
      Math.round(totalNewMinutes * 100) / 100,
      "details:",
      processedSessionDetails.slice(0, 3)
    );

    // Log siteStats before calculation
    console.log("[histo] siteStats keys:", Object.keys(siteStats).length);
    console.log(
      "[histo] siteStats minutes:",
      Object.values(siteStats)
        .map((s) => ({ domain: s.domain, minutes: s.minutes }))
        .slice(0, 5)
    );

    // Calculate total minutes from final siteStats (all accumulated data)
    totalMinutes = 0;
    Object.values(siteStats).forEach((s) => {
      totalMinutes += s.minutes || 0;
    });

    console.log("[histo] totalMinutes before rounding:", totalMinutes);

    // Round to 1 decimal place
    const roundedTotalMinutes = Math.round(totalMinutes * 10) / 10;

    Object.values(siteStats).forEach((s) => {
      // Round to 1 decimal place
      s.minutes = Math.round(s.minutes * 10) / 10;
      s.pctOfDay = roundedTotalMinutes
        ? Math.round((s.minutes / roundedTotalMinutes) * 1000) / 10
        : 0;
    });
    Object.values(categoryStats).forEach((c) => {
      // Round to 1 decimal place
      c.minutes = Math.round(c.minutes * 10) / 10;
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
  await persistCurrentSession(null);
  await appendSession(session);
  console.log("[histo] session ended", reason, {
    domain: session.domain,
    durationMs,
    minutes: Math.round((durationMs / 60000) * 1000) / 1000,
  });

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
  await persistCurrentSession(currentSession);
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
    [CURRENT_SESSION_KEY]: null,
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
    // Aggregate local data and sync to backend (force full sync)
    aggregateAndStore()
      .then(() => syncToBackend(true)) // true = force full sync
      .then(() => {
        console.log("[histo] start-analysis complete (aggregated + synced)");
        sendResponse({ ok: true });
      })
      .catch((err) => {
        console.error("[histo] start-analysis error:", err);
        sendResponse({ ok: false, error: (err as Error)?.message });
      });
    return true;
  }

  if (msg?.action === "manual-sync") {
    console.log("[histo] manual sync request");
    syncToBackend()
      .then(() => {
        console.log("[histo] manual sync complete");
        sendResponse({ ok: true });
      })
      .catch((err) => {
        console.error("[histo] manual sync error:", err);
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

// Initialize: set up periodic aggregation (no auto-sync)
console.log("[histo] background script loaded");
chrome.alarms.create("aggregate", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "aggregate") {
    console.log("[histo] alarm triggered, aggregating");
    aggregateAndStore().catch(console.error);
  }
});

// Try to restore any persisted in-progress session at startup
loadPersistedCurrentSession()
  .then((session) => {
    if (session) {
      currentSession = session;
      console.log("[histo] session restored on startup", session.domain);
    }
  })
  .catch((err) => console.error("[histo] failed to restore session", err));

// Expose functions for console debugging
(globalThis as any).histoDebug = {
  testAggregate: () => aggregateAndStore(),
  testSync: () => syncToBackend(), // 🆕 Test sync function
  checkStorage: () =>
    storageGet([
      "siteStats",
      "processedSessionIds",
      "sessions",
      "lastSyncedAt",
    ]).then((data) => {
      console.log("[debug] storage:", {
        sessions: data.sessions?.length || 0,
        processed: data.processedSessionIds?.length || 0,
        minutes: Object.values(data.siteStats || {}).reduce(
          (s, x: any) => s + (x.minutes || 0),
          0
        ),
        lastSynced: data.lastSyncedAt
          ? new Date(data.lastSyncedAt).toLocaleString()
          : "never",
      });
      return data;
    }),
};
console.log("[histo] debug functions available at window.histoDebug");
