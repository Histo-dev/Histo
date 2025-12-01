import styles from './Domain.module.css'

interface Props {
  site: ISite
  formatedTime: string
  percentage: string
  onOpen?: (domain: string) => void
}

interface ISite {
  domain: string
  category?: string
  minutes: number
  pct?: number
}

const Domain = ({ site, formatedTime, percentage, onOpen }: Props) => {
  return (
    <div key={site.domain} className={styles.row}>
      <div className={styles.name}>{site.domain}</div>
      <span className={styles.legendName}>{site.category ?? '기타'}</span>
      <div className={styles.time}>{formatedTime}</div>
      <div className={styles.pct}>{percentage}%</div>
      <button className={styles.open} onClick={() => onOpen?.(site.domain)}>열기</button>
    </div>
  )
}

export default Domain

export type { ISite }
