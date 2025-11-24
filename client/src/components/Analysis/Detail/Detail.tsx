import styles from "./Detail.module.css";
import useUsageStore from "../../../store/usageStore";
import Domain, { type ISite } from "./Domain";

export default function Detail() {
  // Example final-results view: shows breakdown and CTA
  const data = {
    totalTimeMinutes: 245,
    totalSites: 38,
    sites: [
      { domain: "facebook.com", minutes: 120, pct: 35, category: "소셜" },
      { domain: "youtube.com", minutes: 85, category: "동영상" },
      { domain: "news.example", minutes: 45, category: "뉴스" },
    ],
    categories: [
      { name: "생산성", minutes: 110, color: "#7c63ff" },
      { name: "소셜", minutes: 60, color: "#4f39f6" },
      { name: "동영상", minutes: 40, color: "#f5b357" },
      { name: "뉴스", minutes: 20, color: "#6ee7b7" },
      { name: "쇼핑", minutes: 15, color: "#e6e6ef" },
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

  // totals are read inside StatCards; keep the hook active for subscriptions
  useUsageStore();

  return (
    <>
      <div className={styles.legendCol}>
        {data.sites.map((s) => (
          <Domain
            site={s as ISite}
            formatedTime={formatTime(s.minutes)}
            percentage={((s.minutes / data.totalTimeMinutes) * 100).toFixed(1)}
          />
        ))}
      </div>

      <div className={styles.actions}>
        <button className={styles.primary}>자세히 보기</button>
      </div>
    </>
  );
}
