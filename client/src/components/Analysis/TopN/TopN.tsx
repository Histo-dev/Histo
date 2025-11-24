import styles from "./TopN.module.css";
import Domain, { type ISite } from "../Detail/Domain";

declare const chrome: any

export default function TopN() {
  // Sample finished-analysis data
  const data = {
    totalTimeMinutes: 250,
    topSites: [
      { domain: "facebook.com", minutes: 120, pct: 35, category: "소셜" },
      { domain: "youtube.com", minutes: 85, pct: 25, category: "동영상" },
      { domain: "news.example", minutes: 45, pct: 13, category: "뉴스" },
    ],
  };

  const formatTime = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
    }
    return `${mins}분`;
  };

  const iconPath = chrome.runtime.getURL(`icons/trophy.svg`)

  return (
    <>
      <div className={styles.title}>
        <img src={iconPath} />
        <h3>가장 많이 방문한 사이트</h3>
      </div>
      <div className={styles.list}>
        {data.topSites.map((t) => (
          <Domain
            site={t as ISite}
            formatedTime={formatTime(t.minutes)}
            percentage={((t.minutes / data.totalTimeMinutes) * 100).toFixed(1)}
          />
        ))}
      </div>
    </>
  );
}
