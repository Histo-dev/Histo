import styles from "./InnerTabs.module.css";

type TabKey = "overview" | "topN" | "advice";

type Props = {
  selected?: TabKey;
  onSelect?: (tab: TabKey) => void;
};

export default function InnerTabs({ selected = "overview", onSelect }: Props) {
  return (
    <div className={styles.container} role="tablist" aria-label="내부 탭">
      <button
        className={`${styles.tab} ${
          selected === "overview" ? styles.active : ""
        }`}
        onClick={() => onSelect?.("overview")}
        role="tab"
        aria-selected={selected === "overview"}
      >
        개요
      </button>
      <button
        className={`${styles.tab} ${selected === "topN" ? styles.active : ""}`}
        onClick={() => onSelect?.("topN")}
        role="tab"
        aria-selected={selected === "topN"}
      >
        Top3
      </button>
      <button
        className={`${styles.tab} ${
          selected === "advice" ? styles.active : ""
        }`}
        onClick={() => onSelect?.("advice")}
        role="tab"
        aria-selected={selected === "advice"}
      >
        💡 조언
      </button>
    </div>
  );
}

export type { TabKey };
