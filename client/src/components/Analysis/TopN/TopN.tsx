import { useMemo } from 'react'
import styles from './TopN.module.css'
import Domain, { type ISite } from '../Detail/Domain'
import useUsageStore, { type UsageState } from '../../../store/usageStore'

declare const chrome: any

export default function TopN() {
  const { siteStats, totalTimeMinutes, loading } = useUsageStore((s: UsageState) => ({
    siteStats: s.siteStats,
    totalTimeMinutes: s.totalTimeMinutes,
    loading: s.loading,
  }))

  const topSites = useMemo(() => siteStats.slice(0, 3), [siteStats])

  const formatTime = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
    }
    return `${Math.max(0, Math.round(mins))}분`
  }

  const openDomain = (domain: string) => {
    if (typeof chrome === 'undefined' || !chrome.tabs?.create) return
    chrome.tabs.create({ url: `https://${domain}` })
  }

  const iconPath = typeof chrome !== 'undefined' && chrome.runtime?.getURL ? chrome.runtime.getURL('icons/trophy.svg') : ''

  if (loading) return <div className={styles.contentCenter}>불러오는 중...</div>

  if (topSites.length === 0) {
    return <div className={styles.contentCenter}>아직 분석된 사이트가 없습니다.</div>
  }

  return (
    <>
      <div className={styles.title}>
        {iconPath && <img src={iconPath} />}
        <h3>가장 많이 방문한 사이트</h3>
      </div>
      <div className={styles.list}>
        {topSites.map((t) => (
          <Domain
            key={t.domain}
            site={t as ISite}
            formatedTime={formatTime(t.minutes)}
            percentage={((t.minutes / (totalTimeMinutes || t.minutes || 1)) * 100).toFixed(1)}
            onOpen={openDomain}
          />
        ))}
      </div>
    </>
  )
}
