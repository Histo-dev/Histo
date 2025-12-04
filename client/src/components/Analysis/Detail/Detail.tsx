import { useMemo } from "react";
import styles from "./Detail.module.css";
import useUsageStore from "../../../store/usageStore";
import Domain, { type ISite } from "./Domain";

export default function Detail() {
  const state = useUsageStore();
  const { siteStats, totalTimeMinutes, loading } = state;

  const formatTime = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = Math.round((mins % 60) * 10) / 10;
      return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
    }
    // Show 2 decimal places for precision
    const rounded = Math.round(mins * 100) / 100;
    return `${Math.max(0, rounded)}분`;
  };

  const openDomain = (domain: string) => {
    if (typeof chrome === "undefined" || !chrome.tabs?.create) return;
    chrome.tabs.create({ url: `https://${domain}` });
  };

  const sites = useMemo(
    () =>
      [...siteStats]
        .sort((a, b) => (b.lastVisited || 0) - (a.lastVisited || 0))
        .slice(0, 10),
    [siteStats]
  );

  if (loading)
    return <div className={styles.contentCenter}>불러오는 중...</div>;
  if (sites.length === 0)
    return <div className={styles.contentCenter}>아직 기록이 없습니다.</div>;

  return (
    <>
      <div className={styles.legendCol}>
        {sites.map((s) => (
          <Domain
            key={s.domain}
            site={s as ISite}
            formatedTime={formatTime(s.minutes)}
            percentage={(
              (s.minutes / (totalTimeMinutes || s.minutes || 1)) *
              100
            ).toFixed(1)}
            onOpen={openDomain}
            showDomain={true}
          />
        ))}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.primary}
          onClick={() => {
            if (typeof chrome !== "undefined" && chrome.tabs?.create) {
              chrome.tabs.create({
                url: chrome.runtime.getURL("options.html"),
              });
            }
          }}
        >
          설정으로 이동
        </button>
      </div>
    </>
  );
}
