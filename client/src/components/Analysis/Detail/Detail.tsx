import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Detail.module.css';
import useUsageStore from '../../../store/usageStore';
import { BACKEND_URL } from '../../../config';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type PeriodType = '하루' | '일주일' | '한달';

export default function Detail() {
  const navigate = useNavigate();
  const state = useUsageStore();
  const { categoryStats, totalTimeMinutes, loading, dataRangeDays = 0 } = state;
  const [period, setPeriod] = useState<PeriodType>('하루');
  const [averageData, setAverageData] = useState<
    Array<{ categoryName: string; averageTime: number }>
  >([]);
  const [loadingAverage, setLoadingAverage] = useState(true);

  // 전체 사용자 평균 데이터 가져오기
  useEffect(() => {
    const fetchAverageData = async () => {
      try {
        setLoadingAverage(true);
        const { jwtToken } = await new Promise<{ jwtToken?: string }>((resolve) => {
          chrome.storage.local.get(['jwtToken'], (result) => resolve(result));
        });

        if (!jwtToken) {
          console.log('[histo] no JWT token for average stats, using dummy data');
          setAverageData(getDummyAverageData());
          setLoadingAverage(false);
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        const response = await fetch(
          `${BACKEND_URL}/history/stats/category/average?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`,
          {
            headers: {
              Authorization: `Bearer ${jwtToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setAverageData(data);
      } catch (err) {
        console.error('[histo] failed to fetch average data, using dummy data:', err);
        setAverageData(getDummyAverageData());
      } finally {
        setLoadingAverage(false);
      }
    };

    fetchAverageData();
  }, []);

  // 더미 평균 데이터 생성 (중심 60분 기준 골고루 분산)
  const getDummyAverageData = () => [
    { categoryName: '업무', averageTime: 3600 }, // 60분 (중심)
    { categoryName: '소셜', averageTime: 3900 }, // 65분 (+8%)
    { categoryName: '동영상', averageTime: 3300 }, // 55분 (-8%)
    { categoryName: '뉴스', averageTime: 4200 }, // 70분 (+17%)
    { categoryName: '쇼핑', averageTime: 3000 }, // 50분 (-17%)
    { categoryName: '기타', averageTime: 2700 }, // 45분 (-25%)
  ];

  // 기간별 필요 데이터 일수
  const requiredDays = {
    하루: 0, // 하루는 무조건 활성화
    일주일: 7,
    한달: 30,
  };

  // 데이터 충분성 체크
  const hasEnoughData = (periodType: PeriodType) => {
    if (periodType === '하루') return true; // 하루는 항상 활성화
    return dataRangeDays >= requiredDays[periodType];
  };

  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = Math.round(mins % 60);
    return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
  };

  const radarData = useMemo(() => {
    const maxCategories = 6;
    const allCategoryNames = [
      '업무',
      '소셜',
      '동영상',
      '뉴스',
      '쇼핑',
      '게임',
      '쇼핑',
      '교육',
      '금융',
      '건강',
      '여행',
      '기타',
    ];

    // 내 상위 카테고리
    const sortedCategories = [...categoryStats]
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, maxCategories);

    const categoryMap = new Map<string, { myTime: number; avgTime: number }>();

    // 내 데이터 추가 (분 단위)
    sortedCategories.forEach((cat) => {
      categoryMap.set(cat.name, {
        myTime: cat.minutes,
        avgTime: 0,
      });
    });

    // 평균 데이터 추가 (초를 분으로 변환)
    averageData.forEach((avg) => {
      const existing = categoryMap.get(avg.categoryName);
      const avgMinutes = avg.averageTime / 60;
      if (existing) {
        existing.avgTime = avgMinutes;
      } else if (categoryMap.size < maxCategories) {
        categoryMap.set(avg.categoryName, {
          myTime: 0,
          avgTime: avgMinutes,
        });
      }
    });

    // 6개 미만이면 랜덤 카테고리로 채우기
    if (categoryMap.size < maxCategories) {
      const existingCategories = Array.from(categoryMap.keys());
      const availableCategories = allCategoryNames.filter(
        (cat) => !existingCategories.includes(cat)
      );

      while (categoryMap.size < maxCategories && availableCategories.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableCategories.length);
        const randomCategory = availableCategories[randomIndex];
        availableCategories.splice(randomIndex, 1);

        // 랜덤 카테고리에 더미 평균 데이터 추가
        const randomAvgMinutes = Math.floor(Math.random() * 60) + 10; // 10-70분
        categoryMap.set(randomCategory, {
          myTime: 0,
          avgTime: randomAvgMinutes,
        });
      }
    }

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      나: Math.round(data.myTime * 10) / 10,
      평균: Math.round(data.avgTime * 10) / 10,
    }));
  }, [categoryStats, averageData]);

  const categoryDetails = useMemo(() => {
    return [...categoryStats].sort((a, b) => b.minutes - a.minutes);
  }, [categoryStats]);

  if (loading || loadingAverage) return <div className={styles.contentCenter}>불러오는 중...</div>;

  return (
    <div className={styles.detailPage}>
      {/* 헤더 */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          ←
        </button>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>상세 분석</h1>
          <p className={styles.subtitle}>카테고리별 통계</p>
        </div>
      </div>

      {/* 분석 기간 선택 */}
      <div className={styles.periodSection}>
        <div className={styles.periodLabel}>분석 기간</div>
        <div className={styles.periodButtons}>
          {(['하루', '일주일', '한달'] as PeriodType[]).map((p) => {
            const isAvailable = hasEnoughData(p);
            return (
              <button
                key={p}
                className={`${styles.periodButton} ${period === p ? styles.active : ''} ${
                  !isAvailable ? styles.disabled : ''
                }`}
                onClick={() => isAvailable && setPeriod(p)}
                disabled={!isAvailable}
                title={
                  !isAvailable
                    ? `${requiredDays[p]}일 이상의 데이터가 필요합니다 (현재: ${dataRangeDays}일)`
                    : undefined
                }
              >
                {p}
                {!isAvailable && <span className={styles.disabledBadge}>데이터 부족</span>}
              </button>
            );
          })}
        </div>
        {dataRangeDays < 30 && (
          <div className={styles.dataRangeInfo}>
            현재 {dataRangeDays}일치 데이터 수집됨 • 더 많은 데이터를 수집하면 추가 분석이
            가능합니다
          </div>
        )}
      </div>

      {/* 총 사용 시간 */}
      <div className={styles.totalTimeCard}>
        <div className={styles.totalLabel}>{period} 총 사용 시간</div>
        <div className={styles.totalValue}>{formatTime(totalTimeMinutes)}</div>
      </div>

      {/* 레이더 차트 */}
      <div className={styles.chartSection}>
        <div className={styles.sectionTitle}>카테고리별 비교</div>
        <div className={styles.chartSubtitle}>
          나의 사용 시간 vs 다른 사용자 평균 (분 단위, 상위 6개)
        </div>
        {radarData.length === 0 ? (
          <div className={styles.emptyChart}>데이터가 없습니다.</div>
        ) : (
          <>
            <ResponsiveContainer width='100%' height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke='#e0e0e0' strokeDasharray='3 3' />
                <PolarAngleAxis
                  dataKey='category'
                  tick={{ fill: '#666', fontSize: 11 }}
                  tickLine={false}
                />
                <Radar
                  name='나'
                  dataKey='나'
                  stroke='#7c63ff'
                  fill='#7c63ff'
                  fillOpacity={0.5}
                  strokeWidth={2}
                />
                <Radar
                  name='평균'
                  dataKey='평균'
                  stroke='#6ee7b7'
                  fill='#6ee7b7'
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
            <div className={styles.chartNote}>* 단위: 분 • 상위 6개 카테고리 표시</div>
          </>
        )}
      </div>

      {/* 카테고리별 상세 */}
      <div className={styles.categoryDetailSection}>
        <div className={styles.sectionTitle}>카테고리별 상세</div>
        {categoryDetails.length === 0 ? (
          <div className={styles.emptyState}>데이터가 없습니다.</div>
        ) : (
          <div className={styles.categoryList}>
            {categoryDetails.map((cat) => (
              <div key={cat.name} className={styles.categoryItem}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryDot}></span>
                  <span className={styles.categoryName}>{cat.name}</span>
                  <span className={styles.categoryTime}>{formatTime(cat.minutes)}</span>
                </div>
                <div className={styles.categoryMeta}>{cat.visits}회 방문</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
