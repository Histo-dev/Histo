import { useMemo } from "react";
import CategoryTime, { type ICategory } from "./CategoryTime";
import styles from "./Overview.module.css";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import useUsageStore from "../../../store/usageStore";

const palette = [
  "#7c63ff",
  "#4f39f6",
  "#f5b357",
  "#6ee7b7",
  "#e6e6ef",
  "#f472b6",
];

export default function Overview() {
  const state = useUsageStore();
  const { categoryStats, totalTimeMinutes, loading } = {
    categoryStats: state.categoryStats,
    totalTimeMinutes: state.totalTimeMinutes,
    loading: state.loading,
  };

  const categoriesWithColor = useMemo(() => {
    return categoryStats.map((c, idx) => ({
      ...c,
      color: palette[idx % palette.length],
    }));
  }, [categoryStats]);

  const formatMinutes = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
    }
    return `${Math.max(0, Math.round(mins))}분`;
  };

  const total =
    totalTimeMinutes ||
    categoriesWithColor.reduce(
      (sum: number, c: ICategory) =>
        sum + (typeof c.minutes === "number" ? c.minutes : 0),
      0
    );

  if (loading)
    return <div className={styles.contentCenter}>불러오는 중...</div>;
  if (categoriesWithColor.length === 0)
    return <div className={styles.contentCenter}>데이터가 없습니다.</div>;

  return (
    <>
      <div className={styles.topListSection}>
        <div className={styles.topTitle}>카테고리</div>
        <ul className={styles.topList}>
          {categoriesWithColor.map((c) => (
            <li key={c.name} className={styles.topRow}>
              <CategoryTime
                category={c as ICategory}
                percentage={(
                  (c.minutes / (total || c.minutes || 1)) *
                  100
                ).toFixed(1)}
                formatedMinutes={formatMinutes(c.minutes)}
              />
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.summarySection}>
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie
              data={categoriesWithColor}
              dataKey="minutes"
              nameKey="name"
              innerRadius={28}
              outerRadius={48}
              paddingAngle={4}
            >
              {categoriesWithColor.map((c: ICategory) => (
                <Cell key={c.name} fill={c.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => `${formatMinutes(value)}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
