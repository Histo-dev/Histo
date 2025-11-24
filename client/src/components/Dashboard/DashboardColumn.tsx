import styles from './DashboardColumn.module.css'

export default function DashboardColumn() {
  return (
    <aside className={styles.card}>
      <header className={styles.header}>
        <h4>브라우저 활동</h4>
        <p className={styles.sub}>오늘의 웹 사용 분석</p>
      </header>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>총 시간</div>
          <div className={styles.statValue}>21h 50m</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}>방문</div>
          <div className={styles.statValue}>10개</div>
        </div>
      </div>

      <div className={styles.chartPlaceholder} aria-hidden />

      <ul className={styles.topList}>
        <li><strong>#1</strong> YouTube — 2시간 25분</li>
        <li><strong>#2</strong> GitHub — 2시간 5분</li>
        <li><strong>#3</strong> Notion — 1시간 55분</li>
      </ul>
    </aside>
  )
}
