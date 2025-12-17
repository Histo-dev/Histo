import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Detail.module.css";
import { fetchFromBackend, type UsageState } from "../../../store/usageStore";
import { BACKEND_URL } from "../../../config";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

type PeriodType = "하루" | "일주일" | "한달";

export default function Detail() {
  const navigate = useNavigate();
  const [backendData, setBackendData] = useState<UsageState | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>("하루");
  const [averageData, setAverageData] = useState<
    Array<{ categoryName: string; averageTime: number }>
  >([]);
  const [loadingAverage, setLoadingAverage] = useState(true);

  // 백엔드에서 데이터 가져오기 (period에 따라 변경)
  useEffect(() => {
    const loadBackendData = async () => {
      setLoading(true);
      const days = period === "하루" ? 1 : period === "일주일" ? 7 : 30;
      const data = await fetchFromBackend(days);
      if (data) {
        setBackendData(data);
      }
      setLoading(false);
    };
    loadBackendData();
  }, [period]);

  const categoryStats = backendData?.categoryStats || [];
  const totalTimeMinutes = backendData?.totalTimeMinutes || 0;

  // 전체 사용자 평균 데이터 가져오기 (period에 따라 변경)
  useEffect(() => {
    const fetchAverageData = async () => {
      try {
        setLoadingAverage(true);
        const { jwtToken } = await new Promise<{ jwtToken?: string }>(
          (resolve) => {
            chrome.storage.local.get(["jwtToken"], (result) => resolve(result));
          }
        );

        if (!jwtToken) {
          console.log(
            "[histo] no JWT token for average stats, using dummy data"
          );
          setAverageData(getDummyAverageData());
          setLoadingAverage(false);
          return;
        }

        // period에 따라 날짜 범위 설정
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        const startDate = new Date();
        const days = period === "하루" ? 1 : period === "일주일" ? 7 : 30;
        startDate.setDate(startDate.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0);

        const response = await fetch(
          `${BACKEND_URL}/history/stats/category/average?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
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
        console.error(
          "[histo] failed to fetch average data, using dummy data:",
          err
        );
        setAverageData(getDummyAverageData());
      } finally {
        setLoadingAverage(false);
      }
    };

    fetchAverageData();
  }, [period]);

  // 더미 평균 데이터 생성 (중심 60분 기준 골고루 분산)
  const getDummyAverageData = () => [
    { categoryName: "업무", averageTime: 3600 }, // 60분 (중심)
    { categoryName: "소셜", averageTime: 3900 }, // 65분 (+8%)
    { categoryName: "동영상", averageTime: 3300 }, // 55분 (-8%)
    { categoryName: "뉴스", averageTime: 4200 }, // 70분 (+17%)
    { categoryName: "쇼핑", averageTime: 3000 }, // 50분 (-17%)
    { categoryName: "기타", averageTime: 2700 }, // 45분 (-25%)
  ];

  // 카테고리별 색상 매핑
  const categoryColors: Record<string, string> = {
    업무: "#4f39f6",
    소셜: "#06b6d4",
    엔터테인먼트: "#f59e0b",
    쇼핑: "#ec4899",
    뉴스: "#10b981",
    교육: "#8b5cf6",
    개발: "#3b82f6",
    커뮤니티: "#14b8a6",
    기타: "#6b7280",
  };

  const getCategoryColor = (categoryName: string): string => {
    return categoryColors[categoryName] || "#6b7280"; // 기본 회색
  };

  const formatTime = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = Math.round(mins % 60);
    return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
  };

  const radarData = useMemo(() => {
    const maxCategories = 6;
    const allCategoryNames = [
      "업무",
      "소셜",
      "동영상",
      "뉴스",
      "쇼핑",
      "게임",
      "쇼핑",
      "교육",
      "금융",
      "건강",
      "여행",
      "기타",
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

      while (
        categoryMap.size < maxCategories &&
        availableCategories.length > 0
      ) {
        const randomIndex = Math.floor(
          Math.random() * availableCategories.length
        );
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

  if (loading || loadingAverage) {
    return (
      <div className={styles.contentCenter}>
        <svg
          className={styles.spinner}
          width="50"
          height="50"
          viewBox="0 0 50 50"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="#312c85"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="90, 150"
            strokeDashoffset="0"
          />
        </svg>
        <div style={{ marginTop: 16, color: "#6b7280", fontSize: 14 }}>
          데이터를 불러오는 중...
        </div>
      </div>
    );
  }

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
            return (
              <button
                key={p}
                className={`${styles.periodButton} ${
                  period === p ? styles.active : ""
                }`}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* 비교 차트 */}
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
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e0e0e0" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: "#666", fontSize: 11 }}
                  tickLine={false}
                />
                <Radar
                  name="나"
                  dataKey="나"
                  stroke="#7c63ff"
                  fill="#7c63ff"
                  fillOpacity={0.5}
                  strokeWidth={2}
                />
                <Radar
                  name="평균"
                  dataKey="평균"
                  stroke="#6ee7b7"
                  fill="#6ee7b7"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
            <div className={styles.chartNote}>
              * 단위: 분 • 상위 6개 카테고리 표시
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
                  <span
                    className={styles.categoryDot}
                    style={{ backgroundColor: getCategoryColor(cat.name) }}
                  ></span>
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
