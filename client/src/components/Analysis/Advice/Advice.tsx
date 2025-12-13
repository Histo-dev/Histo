import { useEffect, useState } from 'react';
import { BACKEND_URL } from '../../../config';
import styles from './Advice.module.css';

// 일일 응답
type DailyAdviceResponse = {
  totalTime: number;
  topCategory: string;
  topDomain: string;
  advice: string[];
};

// 주간/월간 응답
type WeeklyMonthlyAdviceItem = {
  type: string;
  category: string;
  message: string;
  data: {
    time: number;
    count: number;
  };
};

type WeeklyMonthlyAdviceResponse = {
  advice: WeeklyMonthlyAdviceItem[];
};

type AdviceResponse = DailyAdviceResponse | WeeklyMonthlyAdviceResponse;

type PeriodType = 'daily' | 'weekly' | 'monthly';

const PERIOD_LABELS = {
  daily: '일일',
  weekly: '주간',
  monthly: '월간',
};

export default function Advice() {
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [adviceData, setAdviceData] = useState<AdviceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchAdvice = async () => {
      try {
        setLoading(true);
        setError('');

        // JWT 토큰 가져오기
        const { jwtToken } = await new Promise<{ jwtToken?: string }>((resolve) => {
          chrome.storage.local.get(['jwtToken'], (result) => resolve(result));
        });

        if (!jwtToken) {
          setError('로그인이 필요합니다.');
          setLoading(false);
          return;
        }

        // 조언 API 호출 (기간별 엔드포인트)
        const response = await fetch(`${BACKEND_URL}/advice/${period}`, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: AdviceResponse = await response.json();
        setAdviceData(data);
      } catch (err) {
        console.error('[histo] failed to fetch advice:', err);
        setError('조언을 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdvice();
  }, [period]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>AI가 분석 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>⚠️ {error}</p>
        </div>
      </div>
    );
  }

  // 일일 응답 타입 체크
  const isDailyResponse = (data: AdviceResponse): data is DailyAdviceResponse => {
    return 'totalTime' in data;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>💡</div>
        <div>
          <h2 className={styles.title}>AI 조언</h2>
          <p className={styles.subtitle}>당신의 웹 사용 패턴을 분석한 맞춤 인사이트</p>
        </div>
      </div>

      {/* 기간 선택 */}
      <div className={styles.periodSection}>
        <div className={styles.periodButtons}>
          {(['daily', 'weekly', 'monthly'] as PeriodType[]).map((p) => (
            <button
              key={p}
              className={`${styles.periodButton} ${period === p ? styles.active : ''}`}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {adviceData && isDailyResponse(adviceData) ? (
        // 일일 조언
        <div className={styles.adviceCard}>
          {/* 통계 정보 */}
          <div className={styles.statsSection}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>총 사용 시간</span>
              <span className={styles.statValue}>
                {Math.floor(adviceData.totalTime / 3600)}시간{' '}
                {Math.floor((adviceData.totalTime % 3600) / 60)}분
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>주요 카테고리</span>
              <span className={styles.statValue}>{adviceData.topCategory}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>가장 많이 방문한 사이트</span>
              <span className={styles.statValue}>{adviceData.topDomain}</span>
            </div>
          </div>

          {/* 조언 내용 */}
          <div className={styles.adviceContent}>
            {adviceData.advice.map((line, idx) => (
              <p key={idx} className={styles.adviceLine}>
                {line}
              </p>
            ))}
          </div>
        </div>
      ) : adviceData ? (
        // 주간/월간 조언
        <div className={styles.adviceCard}>
          <div className={styles.adviceList}>
            {adviceData.advice.map((item, idx) => (
              <div key={idx} className={styles.adviceItem}>
                <div className={styles.adviceMessage}>{item.message}</div>
                <div className={styles.adviceData}>
                  <div className={styles.adviceDataItem}>
                    <span className={styles.adviceDataLabel}>카테고리</span>
                    <span className={styles.adviceDataValue}>{item.category}</span>
                  </div>
                  <div className={styles.adviceDataItem}>
                    <span className={styles.adviceDataLabel}>사용 시간</span>
                    <span className={styles.adviceDataValue}>
                      {Math.floor(item.data.time / 3600)}시간{' '}
                      {Math.floor((item.data.time % 3600) / 60)}분
                    </span>
                  </div>
                  <div className={styles.adviceDataItem}>
                    <span className={styles.adviceDataLabel}>방문 횟수</span>
                    <span className={styles.adviceDataValue}>{item.data.count}회</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.footer}>
        <p className={styles.footerText}>💬 AI가 생성한 조언입니다. 참고용으로 활용해 주세요.</p>
      </div>
    </div>
  );
}
