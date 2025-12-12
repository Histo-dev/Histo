import styles from "./HistoIntro.module.css";

type Props = {
  onStart?: () => void;
  onViewSaved?: () => void;
};

export default function HistoIntro({ onStart, onViewSaved }: Props) {
  return (
    <section className={styles.hero} role="region" aria-label="온보딩">
      <div className={styles.iconWrap} aria-hidden>
        <div className={styles.iconCircle}>
          <IconChart />
        </div>
      </div>

      <h2 className={styles.title}>브라우저 활동 분석</h2>

      <p className={styles.subtitle}>
        웹 브라우저 방문 기록을 분석하여
        <br />
        카테고리별 사용 시간을 확인하세요
      </p>

      <div className={styles.buttonGroup}>
        <button
          className={styles.cta}
          aria-label="새로 분석하기"
          onClick={() => {
            if (onStart) onStart();
          }}
        >
          <span className={styles.ctaIcon} aria-hidden>
            <IconPlay />
          </span>
          <span>새로 분석하기</span>
        </button>

        <button
          className={styles.ctaSecondary}
          aria-label="저장된 분석 보기"
          onClick={() => {
            if (onViewSaved) onViewSaved();
          }}
        >
          <span className={styles.ctaIcon} aria-hidden>
            <IconHistory />
          </span>
          <span>저장된 분석 보기</span>
        </button>
      </div>

      <ul className={styles.features}>
        <li>
          <span className={styles.featureIcon} aria-hidden>
            📊
          </span>
          카테고리별 시간 통계
        </li>
        <li>
          <span className={styles.featureIcon} aria-hidden>
            📈
          </span>
          시간대별 활동 패턴
        </li>
        <li>
          <span className={styles.featureIcon} aria-hidden>
            🔍
          </span>
          상세 방문 기록
        </li>
      </ul>
    </section>
  );
}

function IconChart() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="3" y="14" width="2" height="5" rx="1" fill="#4f39f6" />
      <rect x="8" y="9" width="2" height="10" rx="1" fill="#4f39f6" />
      <rect x="13" y="5" width="2" height="14" rx="1" fill="#4f39f6" />
      <rect x="18" y="11" width="2" height="8" rx="1" fill="#4f39f6" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M5 3v18l15-9L5 3z" fill="#fff" />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 6v6l4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
