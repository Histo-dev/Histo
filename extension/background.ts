// Background service worker prototype for Histo extension
// NOTE: This is TypeScript for readability. Build pipeline should compile to background.js

// Simple prototypes: listen for history visits and tab updates and persist minimal records
declare const chrome: any

function saveVisit(record: any) {
  chrome.storage.local.get({ visits: [] }, (res: any) => {
    const visits = res.visits || []
    visits.push(record)
    // keep only recent N in prototype
    const max = 1000
    if (visits.length > max) visits.splice(0, visits.length - max)
    chrome.storage.local.set({ visits })
  })
}

chrome.history?.onVisited?.addListener((item: any) => {
  const record = { id: item.id, url: item.url, title: item.title, ts: Date.now() }
  console.log('history.onVisited', record)
  saveVisit(record)
})

chrome.tabs?.onUpdated?.addListener((tabId: number, changeInfo: any, tab: any) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const record = { url: tab.url, title: tab.title, ts: Date.now(), from: 'tab_update' }
    console.log('tabs.onUpdated', record)
    saveVisit(record)
  }
})

chrome.runtime.onInstalled?.addListener(() => {
  console.log('Histo background installed')
})

chrome.runtime?.onMessage?.addListener((msg: any, sender: any, sendResponse: any) => {
  if (msg?.action === 'start-analysis') {
    console.log('Received start-analysis from', sender)
    // mark analysis state in storage
    chrome.storage.local.set({ analysisState: 'running', analysisStartedAt: Date.now() })
    // Example: could trigger immediate small aggregation here
    sendResponse({ ok: true })
  }
})
