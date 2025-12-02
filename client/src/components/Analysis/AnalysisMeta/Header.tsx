import styles from "./Header.module.css";

type Props = {
  title: string;
  subtitle: string;
  icon: string;
  onBack?: () => void;
};

const Header = ({ title, subtitle, icon, onBack }: Props) => {
  const iconPath =
    typeof chrome !== "undefined" && chrome?.runtime?.getURL
      ? chrome.runtime.getURL(`icons/${icon}`)
      : "";
  return (
    <div className={styles.header}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "row", gap: "2px" }}>
          {iconPath && <img src={iconPath} />}
          <div className={styles.title}>{title}</div>
        </div>
        <div className={styles.subtitle}>{subtitle}</div>
      </div>
      <button className={styles.close} onClick={onBack}>
        닫기
      </button>
    </div>
  );
};

export default Header;
