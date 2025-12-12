import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Detail.module.css";
import useUsageStore from "../../../store/usageStore";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

type PeriodType = "하루" | "일주일" | "한달";

export default function Detail() {
  const navigate = useNavigate();
  const state = useUsageStore();
  const { categoryStats, totalTimeMinutes, loading, dataRangeDays = 0 } = state;
  const [period, setPeriod] = useState<PeriodType>("하루");

  // 기간별 필요 데이터 일수
  const requiredDays = {
    하루: 0, // 하루는 무조건 활성화
    일주일: 7,
    한달: 30,
  };

  // 데이터 충분성 체크
  const hasEnoughData = (periodType: PeriodType) => {
    if (periodType === "하루") return true; // 하루는 항상 활성화
    return dataRangeDays >= requiredDays[periodType];
  };

  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = Math.round(mins % 60);
    return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
  };

  const radarData = useMemo(() => {
    // 최대 12개 카테고리만 표시 (레이더 차트 가독성을 위해)
    const maxCategories = 12;
    const sortedCategories = [...categoryStats]
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, maxCategories);

    // 데이터 정규화 (0-100 스케일로 변환)
    const maxTime = Math.max(...sortedCategories.map((c) => c.minutes), 1);
    const maxVisits = Math.max(...sortedCategories.map((c) => c.visits), 1);

    return sortedCategories.map((cat) => ({
      category: cat.name,
      시간: Math.round((cat.minutes / maxTime) * 100),
      원시시간: cat.minutes,
      횟수: Math.round((cat.visits / maxVisits) * 100),
      원시횟수: cat.visits,
    }));
  }, [categoryStats]);

  const categoryDetails = useMemo(() => {
    return [...categoryStats].sort((a, b) => b.minutes - a.minutes);
  }, [categoryStats]);

  if (loading)
    return <div className={styles.contentCenter}>불러오는 중...</div>;

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
          {(["하루", "일주일", "한달"] as PeriodType[]).map((p) => {
            const isAvailable = hasEnoughData(p);
            return (
              <button
                key={p}
                className={`${styles.periodButton} ${
                  period === p ? styles.active : ""
                } ${!isAvailable ? styles.disabled : ""}`}
                onClick={() => isAvailable && setPeriod(p)}
                disabled={!isAvailable}
                title={
                  !isAvailable
                    ? `${requiredDays[p]}일 이상의 데이터가 필요합니다 (현재: ${dataRangeDays}일)`
                    : undefined
                }
              >
                {p}
                {!isAvailable && (
                  <span className={styles.disabledBadge}>데이터 부족</span>
                )}
              </button>
            );
          })}
        </div>
        {dataRangeDays < 30 && (
          <div className={styles.dataRangeInfo}>
            현재 {dataRangeDays}일치 데이터 수집됨 • 더 많은 데이터를 수집하면
            추가 분석이 가능합니다
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
        <div className={styles.sectionTitle}>카테고리별 분석</div>
        <div className={styles.chartSubtitle}>
          시간과 방문 횟수 비교 (상위 {Math.min(radarData.length, 12)}개)
        </div>
        {radarData.length === 0 ? (
          <div className={styles.emptyChart}>데이터가 없습니다.</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e0e0e0" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: "#666", fontSize: 11 }}
                  tickLine={false}
                />
                <Radar
                  name="시간"
                  dataKey="시간"
                  stroke="#7c63ff"
                  fill="#7c63ff"
                  fillOpacity={0.5}
                  strokeWidth={2}
                />
                <Radar
                  name="횟수"
                  dataKey="횟수"
                  stroke="#6ee7b7"
                  fill="#6ee7b7"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ backgroundColor: "#7c63ff" }}
                ></span>
                시간(분)
              </div>
              <div className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ backgroundColor: "#6ee7b7" }}
                ></span>
                횟수
              </div>
            </div>
            <div className={styles.chartNote}>
              * 데이터는 상대적 비율로 정규화되어 표시됩니다
            </div>
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
                  <span className={styles.categoryTime}>
                    {formatTime(cat.minutes)}
                  </span>
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
