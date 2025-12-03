import styles from './CategoryTime.module.css'

interface Props {
  category: ICategory
  percentage: string
  formatedMinutes: string
}

interface ICategory {
  name: string
  minutes: number
  color?: string
}

const CategoryTime = ({ category, percentage, formatedMinutes }: Props) => {
  const color = category.color ?? '#7c63ff'
  return (
    <>
      <div className={styles.categoryInfo}>
        <div className={styles.categoryColor} aria-hidden style={{ backgroundColor: color }} />
        <div>
          <div className={styles.categoryName}>{category.name}</div>
          <div className={styles.categoryMeta}>
            {percentage}% · {formatedMinutes}
          </div>
        </div>
      </div>
      <div className={styles.barWrap}>
        <div
          className={styles.bar}
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color}, ${color})`,
          }}
        />
      </div>
    </>
  )
}

export default CategoryTime

export type { ICategory }
