(() => {
  // extension/background.ts
  function saveVisit(record) {
    chrome.storage.local.get({ visits: [] }, (res) => {
      const visits = res.visits || [];
      visits.push(record);
      const max = 1e3;
      if (visits.length > max) visits.splice(0, visits.length - max);
      chrome.storage.local.set({ visits });
    });
  }
  chrome.history?.onVisited?.addListener((item) => {
    const record = { id: item.id, url: item.url, title: item.title, ts: Date.now() };
    console.log("history.onVisited", record);
    saveVisit(record);
  });
  chrome.tabs?.onUpdated?.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
      const record = { url: tab.url, title: tab.title, ts: Date.now(), from: "tab_update" };
      console.log("tabs.onUpdated", record);
      saveVisit(record);
    }
  });
  chrome.runtime.onInstalled?.addListener(() => {
    console.log("Histo background installed");
  });
  chrome.runtime?.onMessage?.addListener((msg, sender, sendResponse) => {
    if (msg?.action === "start-analysis") {
      console.log("Received start-analysis from", sender);
      chrome.storage.local.set({ analysisState: "running", analysisStartedAt: Date.now() });
      sendResponse({ ok: true });
    }
  });
})();
