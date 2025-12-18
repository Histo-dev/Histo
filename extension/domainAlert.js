// 도메인별 사용시간 알림 백그라운드 스크립트
// chrome.storage.local 사용, 알림 권한 필요

const STORAGE_KEY = "domainAlertSettings";
const DOMAIN_TIMERS_KEY = "domainAlertTimers";

// 도메인별 알림 설정 불러오기
function getDomainAlertSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

// 도메인별 누적 사용시간 불러오기
function getDomainTimers() {
  return new Promise((resolve) => {
    chrome.storage.local.get([DOMAIN_TIMERS_KEY], (result) => {
      resolve(result[DOMAIN_TIMERS_KEY] || {});
    });
  });
}

// 도메인별 누적 사용시간 저장
function setDomainTimers(timers) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [DOMAIN_TIMERS_KEY]: timers }, resolve);
  });
}

// 현재 활성 탭의 도메인 추출
function getActiveDomain(callback) {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    if (tabs.length === 0) return callback(null);
    try {
      const url = new URL(tabs[0].url);
      callback(url.hostname.replace(/^www\./, ""));
    } catch {
      callback(null);
    }
  });
}

// 1분마다 타이머 증가 및 알림 체크
chrome.alarms.create("domainAlertTick", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "domainAlertTick") return;
  getActiveDomain(async (domain) => {
    if (!domain) return;
    const [settings, timers] = await Promise.all([
      getDomainAlertSettings(),
      getDomainTimers(),
    ]);
    const setting = settings.find((s) => s.domain === domain);
    if (!setting) return;
    timers[domain] = (timers[domain] || 0) + 1;
    if (timers[domain] === setting.minutes) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Histo 알림",
        message: `${domain}을(를) ${setting.minutes}분 사용했습니다.`,
      });
    }
    await setDomainTimers(timers);
  });
});

// 탭/윈도우 전환, Idle 등에서 타이머 일시정지/재개는 기존 세션 트래킹 로직과 연동 필요
