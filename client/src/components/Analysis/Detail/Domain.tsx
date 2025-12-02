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
  // Generate favicon URL from domain
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(site.domain)}&sz=32`;

  return (
    <div key={site.domain} className={styles.row}>
      <img 
        src={faviconUrl} 
        alt={site.domain}
        className={styles.favicon}
        title={site.domain}
        onError={(e) => {
          // Fallback to text if favicon fails
          e.currentTarget.style.display = 'none';
        }}
      />
      <span className={styles.legendName}>{site.category ?? '기타'}</span>
      <div className={styles.time}>{formatedTime}</div>
      <div className={styles.pct}>{percentage}%</div>
      <button className={styles.open} onClick={() => onOpen?.(site.domain)}>열기</button>
    </div>
  )
}

export default Domain

export type { ISite }
