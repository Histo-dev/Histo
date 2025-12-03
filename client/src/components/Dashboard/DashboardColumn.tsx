import styles from "./DashboardColumn.module.css";
import useUsageStore from "../../store/UsageContext";

export default function DashboardColumn() {
  const { totalTimeMinutes, totalSites, siteStats, loading } = useUsageStore();

  const formatTime = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
    }
    return `${Math.max(0, Math.round(mins))}분`;
  };

  const topSites = [...siteStats]
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 3);

  if (loading) {
    return (
      <aside className={styles.card}>
        <header className={styles.header}>
          <h4>브라우저 활동</h4>
          <p className={styles.sub}>불러오는 중...</p>
        </header>
      </aside>
    );
  }

  return (
    <aside className={styles.card}>
      <header className={styles.header}>
        <h4>브라우저 활동</h4>
        <p className={styles.sub}>오늘의 웹 사용 분석</p>
      </header>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>총 시간</div>
          <div className={styles.statValue}>{formatTime(totalTimeMinutes)}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>방문</div>
          <div className={styles.statValue}>{totalSites}개</div>
        </div>
      </div>

      <div className={styles.chartPlaceholder} aria-hidden />

      <ul className={styles.topList}>
        {topSites.length > 0 ? (
          topSites.map((site, idx) => (
            <li key={site.domain}>
              <strong>#{idx + 1}</strong> {site.domain} —{" "}
              {formatTime(site.minutes)}
            </li>
          ))
        ) : (
          <li>아직 데이터가 없습니다</li>
        )}
      </ul>
    </aside>
  );
}
