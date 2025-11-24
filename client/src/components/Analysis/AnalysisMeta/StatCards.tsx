import styles from './StatCards.module.css'
import useUsageStore from '../../../store/usageStore'

type Props = {
  timeMinutes?: number
  sites?: number
  format?: (mins: number) => string
}

export default function StatCards({ timeMinutes, sites, format }: Props) {
  const totals = useUsageStore()
  const minutes = typeof timeMinutes === 'number' ? timeMinutes : totals.totalTimeMinutes
  const totalSites = typeof sites === 'number' ? sites : totals.totalSites

  const fmt = format
    ? format
    : (m: number) => (m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 === 0 ? '' : ` ${m % 60}분`}` : `${m}분`)

  return (
    <div className={styles.statCards}>
      <div className={styles.statCard}>
        <div className={styles.statValue}>{fmt(minutes)}</div>
        <div className={styles.statLabel}>총 사용 시간</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statValue}>{totalSites}</div>
        <div className={styles.statLabel}>방문 사이트 수</div>
      </div>
    </div>
  )
}
