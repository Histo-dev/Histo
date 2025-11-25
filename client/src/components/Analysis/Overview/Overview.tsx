import CategoryTime, { type ICategory } from './CategoryTime'
import styles from './Overview.module.css'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export default function Overview() {
  const testData = {
    totalMinutes: 345,
    categories: [
      { name: '소셜', minutes: 120, color: '#7c63ff' },
      { name: '동영상', minutes: 85, color: '#4f39f6' },
      { name: '뉴스', minutes: 45, color: '#f5b357' },
      { name: '검색', minutes: 30, color: '#6ee7b7' },
      { name: '기타', minutes: 20, color: '#e6e6ef' },
    ],
  }

  const formatMinutes = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
    }
    return `${mins}분`
  }

  return (
    <>
      <div className={styles.topListSection}>
        <div className={styles.topTitle}>카테고리</div>
        <ul className={styles.topList}>
          {testData.categories.map((c) => (
            <li key={c.name} className={styles.topRow}>
              <CategoryTime category={c as ICategory} percentage={((c.minutes / testData.totalMinutes) * 100).toFixed(1)} formatedMinutes={formatMinutes(c.minutes)}/>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.summarySection}>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={testData.categories} dataKey="minutes" nameKey="name" innerRadius={28} outerRadius={48} paddingAngle={4}>
                {testData.categories.map((c) => (
                  <Cell key={c.name} fill={c.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `${formatMinutes(value)}`} />
            </PieChart>
          </ResponsiveContainer>
      </div>
    </>
  )
}