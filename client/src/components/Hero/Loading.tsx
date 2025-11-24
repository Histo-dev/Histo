import styles from './Loading.module.css'

function BigSpinner() {
  return (
    <svg className={styles.spinner} viewBox="0 0 48 48" width="96" height="96" aria-hidden>
      <circle cx="24" cy="24" r="18" stroke="#ebe9ff" strokeWidth="6" fill="none" />
      <path d="M42 24a18 18 0 0 0-18-18" stroke="#4f39f6" strokeWidth="6" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export default function Loading() {
  return (
    <div className={styles.container} role="status" aria-label="분석 중">
      {/* <div className={styles.inner}> */}
        <BigSpinner />
        <h3 className={styles.title}>분석 중...</h3>
        <p className={styles.subtitle}>방문 기록을 분석하고 있습니다</p>

        <ul className={styles.steps}>
          <li><span className={styles.dot} style={{opacity:1}} />방문 기록 수집 중</li>
          <li><span className={styles.dot} style={{opacity:0.98}} />카테고리 분류 중</li>
          <li><span className={styles.dot} style={{opacity:0.93}} />통계 생성 중</li>
        </ul>
      {/* </div> */}
    </div>
  )
}
