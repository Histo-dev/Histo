(() => {
  // extension/background.ts
  var MAX_VISITS = 1e3;
  var MAX_SESSIONS = 500;
  var DAY_KEY = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  var CURRENT_SESSION_KEY = "currentSession";
  var randomId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  var storageGet = (keys) => new Promise(
    (resolve) => chrome.storage.local.get(keys ?? null, (res) => resolve(res))
  );
  var storageSet = (data) => new Promise(
    (resolve) => chrome.storage.local.set(data, () => resolve())
  );
  var getDomain = (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "unknown";
    }
  };
  var loadPersistedCurrentSession = async () => {
    const data = await storageGet({
      [CURRENT_SESSION_KEY]: null
    });
    return data.currentSession ?? null;
  };
  var persistCurrentSession = async (session) => {
    if (session) {
      await storageSet({ [CURRENT_SESSION_KEY]: session });
    } else {
      await storageSet({ [CURRENT_SESSION_KEY]: null });
    }
  };
  var appendVisit = async (visit) => {
    const data = await storageGet({ visits: [] });
    const visits = data.visits ?? [];
    visits.push(visit);
    if (visits.length > MAX_VISITS) visits.splice(0, visits.length - MAX_VISITS);
    await storageSet({ visits });
  };
  var appendSession = async (session) => {
    const data = await storageGet({ sessions: [] });
    const sessions = data.sessions ?? [];
    sessions.push(session);
    if (sessions.length > MAX_SESSIONS)
      sessions.splice(0, sessions.length - MAX_SESSIONS);
    await storageSet({ sessions });
  };
  var archiveDailyData = async (dailyTotal) => {
    const data = await storageGet({
      dailyHistory: {}
    });
    const dailyHistory = data.dailyHistory ?? {};
    dailyHistory[dailyTotal.date] = dailyTotal;
    await storageSet({ dailyHistory });
    console.log("[histo] archived daily data:", dailyTotal);
  };
  var checkAndResetIfNewDay = async () => {
    const data = await storageGet();
    const currentDate = DAY_KEY();
    const lastDate = data.lastDate;
    if (lastDate && lastDate !== currentDate) {
      const {
        siteStats = {},
        categoryStats = {},
        dailyTotals = null
      } = await storageGet(["siteStats", "categoryStats", "dailyTotals"]);
      if (dailyTotals && dailyTotals.totalMinutes > 0) {
        await archiveDailyData(dailyTotals);
      }
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
          totalVisits: 0
        },
        lastDate: currentDate
      });
      currentSession = null;
      console.log("[histo] new day detected, data reset");
    }
    if (!lastDate) {
      await storageSet({ lastDate: currentDate });
    }
  };
  var categorize = (domain, title, categoryMap) => {
    if (categoryMap?.[domain]) return categoryMap[domain];
    const t = `${domain} ${title ?? ""}`.toLowerCase();
    if (t.includes("youtube") || t.includes("netflix") || t.includes("video"))
      return "\uB3D9\uC601\uC0C1";
    if (t.includes("facebook") || t.includes("instagram") || t.includes("twitter") || t.includes("x.com"))
      return "\uC18C\uC15C";
    if (t.includes("docs") || t.includes("notion") || t.includes("github") || t.includes("gitlab") || t.includes("bitbucket") || t.includes("stackoverflow") || t.includes("jira") || t.includes("slack") || t.includes("vscode"))
      return "\uC5C5\uBB34";
    if (t.includes("news")) return "\uB274\uC2A4";
    if (t.includes("shopping") || t.includes("shop") || t.includes("store"))
      return "\uC1FC\uD551";
    return "\uAE30\uD0C0";
  };
  var aggregateAndStore = async () => {
    console.log("[histo] aggregateAndStore starting");
    try {
      await checkAndResetIfNewDay();
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
        processedSessionIds = []
      } = await storageGet([
        "sessions",
        "visits",
        "categoryMap",
        "siteStats",
        "categoryStats",
        "processedSessionIds"
      ]);
      console.log("[histo] loaded data:", {
        sessionsCount: sessions?.length || 0,
        processedCount: processedSessionIds?.length || 0,
        siteStatsCount: Object.keys(existingSiteStats || {}).length
      });
      const currentSessionIds = new Set(sessions.map((s) => s.id));
      const validProcessedIds = (processedSessionIds || []).filter(
        (id) => currentSessionIds.has(id)
      );
      if (validProcessedIds.length < (processedSessionIds?.length || 0)) {
        console.log(
          "[histo] trimmed processedIds:",
          validProcessedIds.length,
          "from",
          processedSessionIds?.length
        );
      }
      let allSessions = [...sessions];
      if (currentSession) {
        const end = Date.now();
        const durationMs = Math.max(0, end - currentSession.start);
        allSessions.push({
          ...currentSession,
          end,
          durationMs
        });
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
            totalVisits: visits.length
          },
          analysisState: "idle",
          lastAggregatedAt: Date.now()
        });
        return;
      }
      const siteStats = JSON.parse(
        JSON.stringify(existingSiteStats || {})
      );
      const categoryStats = JSON.parse(
        JSON.stringify(existingCategoryStats || {})
      );
      let totalMinutes = 0;
      let newProcessedIds = [...validProcessedIds];
      let newSessionsCount = 0;
      let totalNewMinutes = 0;
      const processedSessionDetails = [];
      allSessions.forEach((s) => {
        if (newProcessedIds.includes(s.id)) {
          return;
        }
        const durationMs = s.durationMs ?? (s.end ? s.end - s.start : 0);
        const minutes = Math.max(0, durationMs) / 6e4;
        totalNewMinutes += minutes;
        totalMinutes += minutes;
        const domain = s.domain;
        processedSessionDetails.push({
          domain,
          durationMs,
          minutes: Math.round(minutes * 100) / 100
        });
        if (!siteStats[domain]) {
          siteStats[domain] = {
            domain,
            minutes: 0,
            visits: 0,
            lastVisited: s.end ?? s.start
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
          categoryMap
        );
        siteStats[domain].category = cat;
        if (!categoryStats[cat])
          categoryStats[cat] = { name: cat, minutes: 0, visits: 0, sites: 0 };
        categoryStats[cat].minutes += minutes;
        categoryStats[cat].visits += 1;
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
      console.log("[histo] siteStats keys:", Object.keys(siteStats).length);
      console.log(
        "[histo] siteStats minutes:",
        Object.values(siteStats).map((s) => ({ domain: s.domain, minutes: s.minutes })).slice(0, 5)
      );
      totalMinutes = 0;
      Object.values(siteStats).forEach((s) => {
        totalMinutes += s.minutes || 0;
      });
      console.log("[histo] totalMinutes before rounding:", totalMinutes);
      const roundedTotalMinutes = Math.round(totalMinutes * 10) / 10;
      Object.values(siteStats).forEach((s) => {
        s.minutes = Math.round(s.minutes * 10) / 10;
        s.pctOfDay = roundedTotalMinutes ? Math.round(s.minutes / roundedTotalMinutes * 1e3) / 10 : 0;
      });
      Object.values(categoryStats).forEach((c) => {
        c.minutes = Math.round(c.minutes * 10) / 10;
        c.sites = Object.values(siteStats).filter(
          (s) => s.category === c.name
        ).length;
      });
      const finalCategoryStats = {};
      Object.values(siteStats).forEach((s) => {
        if (!s.category) return;
        if (!finalCategoryStats[s.category]) {
          finalCategoryStats[s.category] = {
            name: s.category,
            minutes: 0,
            visits: 0,
            sites: 0
          };
        }
        finalCategoryStats[s.category].minutes += s.minutes || 0;
        finalCategoryStats[s.category].visits += s.visits || 0;
      });
      Object.values(finalCategoryStats).forEach((c) => {
        c.sites = Object.values(siteStats).filter(
          (s) => s.category === c.name
        ).length;
      });
      const dailyTotals = {
        date: DAY_KEY(),
        totalMinutes: roundedTotalMinutes,
        totalSites: Object.keys(siteStats).length,
        totalVisits: visits.length
      };
      await storageSet({
        siteStats,
        categoryStats: finalCategoryStats,
        dailyTotals,
        processedSessionIds: newProcessedIds,
        // Keep sessions - they accumulate throughout the day
        // Only cleared on daily reset
        analysisState: "idle",
        lastAggregatedAt: Date.now()
      });
      console.log("[histo] aggregateAndStore completed successfully", {
        totalMinutes: roundedTotalMinutes,
        siteCount: Object.keys(siteStats).length,
        processedIdsSaved: newProcessedIds.length
      });
    } catch (err) {
      console.error("[histo] aggregateAndStore error:", err);
      throw err;
    }
  };
  var currentSession = null;
  var endSession = async (reason) => {
    if (!currentSession) return;
    const end = Date.now();
    const durationMs = Math.max(0, end - currentSession.start);
    const session = { ...currentSession, end, durationMs };
    currentSession = null;
    await persistCurrentSession(null);
    await appendSession(session);
    console.log("[histo] session ended", reason, {
      domain: session.domain,
      durationMs,
      minutes: Math.round(durationMs / 6e4 * 1e3) / 1e3
    });
    aggregateAndStore().catch((err) => {
      console.error("[histo] delayed aggregateAndStore failed:", err);
    });
  };
  var startSession = async (url, tabId, windowId) => {
    if (!url) return;
    await endSession("switch");
    const domain = getDomain(url);
    currentSession = {
      id: randomId(),
      url,
      domain,
      start: Date.now(),
      tabId,
      windowId
    };
    await persistCurrentSession(currentSession);
    console.log("[histo] session started", domain);
  };
  chrome.history?.onVisited?.addListener((item) => {
    appendVisit({
      id: item.id,
      url: item.url ?? "",
      title: item.title,
      ts: Date.now(),
      source: "history"
    }).catch(console.error);
  });
  chrome.tabs?.onUpdated?.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      appendVisit({
        url: tab.url,
        title: tab.title,
        ts: Date.now(),
        source: "tab_update"
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
        totalVisits: 0
      }
    });
  });
  chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
    if (msg?.action === "start-analysis") {
      console.log("[histo] start-analysis request");
      aggregateAndStore().then(() => {
        console.log("[histo] start-analysis complete");
        sendResponse({ ok: true });
      }).catch((err) => {
        console.error("[histo] start-analysis error:", err);
        sendResponse({ ok: false, error: err?.message });
      });
      return true;
    }
    if (msg?.action === "get-data") {
      console.log("[histo] get-data request");
      try {
        sendResponse({ ok: true, data: null });
        console.log("[histo] sendResponse called");
      } catch (e) {
        console.error("[histo] sendResponse error:", e);
      }
      aggregateAndStore().catch((err) => {
        console.error("[histo] background aggregation failed:", err);
      });
      return false;
    }
    return void 0;
  });
  console.log("[histo] background script loaded");
  chrome.alarms.create("aggregate", { periodInMinutes: 1 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "aggregate") {
      console.log("[histo] alarm triggered, aggregating");
      aggregateAndStore().catch(console.error);
    }
  });
  loadPersistedCurrentSession().then((session) => {
    if (session) {
      currentSession = session;
      console.log("[histo] session restored on startup", session.domain);
    }
  }).catch((err) => console.error("[histo] failed to restore session", err));
  globalThis.histoDebug = {
    testAggregate: () => aggregateAndStore(),
    checkStorage: () => storageGet(["siteStats", "processedSessionIds", "sessions"]).then(
      (data) => {
        console.log("[debug] storage:", {
          sessions: data.sessions?.length || 0,
          processed: data.processedSessionIds?.length || 0,
          minutes: Object.values(data.siteStats || {}).reduce(
            (s, x) => s + (x.minutes || 0),
            0
          )
        });
        return data;
      }
    )
  };
  console.log("[histo] debug functions available at window.histoDebug");
})();
