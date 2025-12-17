import { useMemo } from "react";
import styles from "./TopN.module.css";
import Domain, { type ISite } from "../Detail/Domain";
import useUsageStore from "../../../store/usageStore";

export default function TopN() {
  const state = useUsageStore();
  const { siteStats, totalTimeMinutes, loading } = state;

  // Sort by minutes (time spent)
  const topByTime = useMemo(() => {
    return [...siteStats].sort((a, b) => b.minutes - a.minutes).slice(0, 3);
  }, [siteStats]);

  // Sort by visits (visit count)
  const topByVisits = useMemo(() => {
    return [...siteStats].sort((a, b) => b.visits - a.visits).slice(0, 3);
  }, [siteStats]);

  const formatTime = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = Math.round((mins % 60) * 10) / 10;
      return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
    }
    // Round to 1 decimal place
    return `${Math.max(0, Math.round(mins * 10) / 10)}분`;
  };

  const openDomain = (domain: string) => {
    if (typeof chrome === "undefined" || !chrome.tabs?.create) return;
    chrome.tabs.create({ url: `https://${domain}` });
  };

  const trophyIcon =
    typeof chrome !== "undefined" && chrome.runtime?.getURL
      ? chrome.runtime.getURL("icons/trophy.svg")
      : "";

  if (loading)
    return <div className={styles.contentCenter}>불러오는 중...</div>;

  const hasData = topByTime.length > 0 || topByVisits.length > 0;

  if (!hasData) {
    return (
      <div className={styles.contentCenter}>아직 분석된 사이트가 없습니다.</div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2>🏆 TOP 3</h2>
      </div>
      <div className={styles.container}>
        {/* Most Time Spent */}
        {topByTime.length > 0 && (
          <div className={styles.section}>
            <div className={styles.title}>
              {trophyIcon && <img src={trophyIcon} alt="trophy" />}
              <h3>가장 오래 체류한 사이트</h3>
            </div>
            <div className={styles.list}>
              {topByTime.map((t, idx) => (
                <div key={t.domain} className={styles.rankItem}>
                  <div className={styles.rank}>{idx + 1}</div>
                  <Domain
                    site={t as ISite}
                    formatedTime={formatTime(t.minutes)}
                    percentage={(
                      (t.minutes / (totalTimeMinutes || t.minutes || 1)) *
                      100
                    ).toFixed(1)}
                    onOpen={openDomain}
                    showDomain={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Most Visited */}
        {topByVisits.length > 0 && (
          <div className={styles.section}>
            <div className={styles.title}>
              {trophyIcon && <img src={trophyIcon} alt="trophy" />}
              <h3>가장 많이 방문한 사이트</h3>
            </div>
            <div className={styles.list}>
              {topByVisits.map((t, idx) => (
                <div key={t.domain} className={styles.rankItem}>
                  <div className={styles.rank}>{idx + 1}</div>
                  <Domain
                    site={t as ISite}
                    formatedTime={`${t.visits}회`}
                    percentage={(
                      (t.visits /
                        (siteStats.reduce((sum, s) => sum + s.visits, 0) ||
                          1)) *
                      100
                    ).toFixed(1)}
                    onOpen={openDomain}
                    showDomain={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
