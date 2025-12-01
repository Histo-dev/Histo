(() => {
  // extension/background.ts
  var MAX_VISITS = 1e3;
  var MAX_SESSIONS = 500;
  var DAY_KEY = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  var randomId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  var storageGet = (keys) => new Promise((resolve) => chrome.storage.local.get(keys ?? null, (res) => resolve(res)));
  var storageSet = (data) => new Promise((resolve) => chrome.storage.local.set(data, () => resolve()));
  var getDomain = (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "unknown";
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
    if (sessions.length > MAX_SESSIONS) sessions.splice(0, sessions.length - MAX_SESSIONS);
    await storageSet({ sessions });
  };
  var categorize = (domain, title, categoryMap) => {
    if (categoryMap?.[domain]) return categoryMap[domain];
    const t = `${domain} ${title ?? ""}`.toLowerCase();
    if (t.includes("youtube") || t.includes("netflix") || t.includes("video")) return "\uB3D9\uC601\uC0C1";
    if (t.includes("facebook") || t.includes("instagram") || t.includes("twitter") || t.includes("x.com")) return "\uC18C\uC15C";
    if (t.includes("docs") || t.includes("notion") || t.includes("github")) return "\uC5C5\uBB34";
    if (t.includes("news")) return "\uB274\uC2A4";
    if (t.includes("shopping") || t.includes("shop") || t.includes("store")) return "\uC1FC\uD551";
    return "\uAE30\uD0C0";
  };
  var aggregateAndStore = async () => {
    const { sessions = [], visits = [], categoryMap = {} } = await storageGet(["sessions", "visits", "categoryMap"]);
    if (!Array.isArray(sessions) || sessions.length === 0) {
      await storageSet({
        siteStats: {},
        categoryStats: {},
        dailyTotals: { date: DAY_KEY(), totalMinutes: 0, totalSites: 0, totalVisits: visits.length },
        analysisState: "idle",
        lastAggregatedAt: Date.now()
      });
      return;
    }
    const siteStats = {};
    const categoryStats = {};
    let totalMinutes = 0;
    sessions.forEach((s) => {
      const durationMs = s.durationMs ?? (s.end ? s.end - s.start : 0);
      const minutes = Math.max(0, durationMs) / 6e4;
      totalMinutes += minutes;
      const domain = s.domain;
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
      siteStats[domain].lastVisited = Math.max(siteStats[domain].lastVisited, s.end ?? s.start);
      const cat = categorize(domain, s.url, categoryMap);
      siteStats[domain].category = cat;
      if (!categoryStats[cat]) categoryStats[cat] = { name: cat, minutes: 0, visits: 0, sites: 0 };
      categoryStats[cat].minutes += minutes;
      categoryStats[cat].visits += 1;
    });
    Object.values(siteStats).forEach((s) => {
      s.minutes = Math.round(s.minutes);
      s.pctOfDay = totalMinutes ? Math.round(s.minutes / totalMinutes * 1e3) / 10 : 0;
    });
    Object.values(categoryStats).forEach((c) => {
      c.minutes = Math.round(c.minutes);
      c.sites = Object.values(siteStats).filter((s) => s.category === c.name).length;
    });
    const dailyTotals = {
      date: DAY_KEY(),
      totalMinutes: Math.round(totalMinutes),
      totalSites: Object.keys(siteStats).length,
      totalVisits: visits.length
    };
    await storageSet({
      siteStats,
      categoryStats,
      dailyTotals,
      analysisState: "idle",
      lastAggregatedAt: Date.now()
    });
  };
  var currentSession = null;
  var endSession = async (reason) => {
    if (!currentSession) return;
    const end = Date.now();
    const durationMs = Math.max(0, end - currentSession.start);
    const session = { ...currentSession, end, durationMs };
    currentSession = null;
    await appendSession(session);
    await aggregateAndStore();
    console.log("[histo] session ended", reason, session);
  };
  var startSession = async (url, tabId, windowId) => {
    if (!url) return;
    await endSession("switch");
    const domain = getDomain(url);
    currentSession = { id: randomId(), url, domain, start: Date.now(), tabId, windowId };
    console.log("[histo] session started", domain);
  };
  chrome.history?.onVisited?.addListener((item) => {
    appendVisit({ id: item.id, url: item.url ?? "", title: item.title, ts: Date.now(), source: "history" }).catch(console.error);
  });
  chrome.tabs?.onUpdated?.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      appendVisit({ url: tab.url, title: tab.title, ts: Date.now(), source: "tab_update" }).catch(console.error);
      if (tab.active) startSession(tab.url, tabId, tab.windowId).catch(console.error);
    }
  });
  chrome.tabs?.onActivated?.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (chrome.runtime.lastError) return;
      if (tab?.url) startSession(tab.url, activeInfo.tabId, tab.windowId).catch(console.error);
    });
  });
  chrome.tabs?.onRemoved?.addListener((tabId) => {
    if (currentSession?.tabId === tabId) endSession("tab-removed").catch(console.error);
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
    storageSet({ analysisState: "idle" });
  });
  chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
    if (msg?.action === "start-analysis") {
      storageSet({ analysisState: "running", analysisStartedAt: Date.now() }).then(() => aggregateAndStore()).then(() => sendResponse({ ok: true })).catch((err) => {
        console.error(err);
        sendResponse({ ok: false, error: err?.message });
      });
      return true;
    }
    return void 0;
  });
})();
