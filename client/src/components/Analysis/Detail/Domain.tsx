import styles from './Domain.module.css'
interface Props {
    site: ISite,
    formatedTime: string,
    percentage: string
}

interface ISite {
    domain: string,
    category: string,
    minutes: number,
    pct: number,
}

const Domain = ({site, formatedTime, percentage}: Props) => {
  return (
    <div key={site.domain} className={styles.row}>
      {/* <div className={styles.legend} style={{ background:  }} /> */}
      <div className={styles.name}>{site.domain}</div>
      <span className={styles.legendName}>{site.category}</span>
      <div className={styles.time}>{formatedTime}</div>
      <div className={styles.pct}>
        {percentage}%
      </div>
    </div>
  );
};

export default Domain;

export type { ISite }