import styles from "./Domain.module.css";

interface Props {
  site: ISite;
  formatedTime: string;
  percentage: string;
  onOpen?: (domain: string) => void;
  showDomain?: boolean;
}

interface ISite {
  domain: string;
  category?: string;
  minutes: number;
  pct?: number;
}

const Domain = ({
  site,
  formatedTime,
  percentage,
  onOpen,
  showDomain = false,
}: Props) => {
  // Get display name for domain (handles extension IDs)
  const getDisplayName = (domain: string): string => {
    // Extension ID - show as "Histo"
    if (domain === "ncpbnmigfbdpnpppjfefnknhbfpfjfgl") {
      return "Histo";
    }
    return domain;
  };

  // Get accurate favicon based on domain/service
  const getAccurateFaviconUrl = (domain: string): string => {
    const lowercaseDomain = domain.toLowerCase();

    // Extension ID - use Histo icon or placeholder
    if (domain === "ncpbnmigfbdpnpppjfefnknhbfpfjfgl") {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect fill='%234CAF50' width='48' height='48'/%3E%3Ctext x='24' y='30' font-size='20' font-weight='bold' fill='white' text-anchor='middle'%3EH%3C/text%3E%3C/svg%3E";
    }

    // Special cases for better icons
    if (
      lowercaseDomain.includes("docs.google.com") ||
      lowercaseDomain === "docs.google.com"
    ) {
      return "https://www.gstatic.com/images/branding/product/1x/docs_2020q4_48dp.png";
    }
    if (
      lowercaseDomain.includes("drive.google.com") ||
      lowercaseDomain === "drive.google.com"
    ) {
      return "https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png";
    }
    if (
      lowercaseDomain.includes("sheets.google.com") ||
      lowercaseDomain === "sheets.google.com"
    ) {
      return "https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png";
    }
    if (
      lowercaseDomain.includes("slides.google.com") ||
      lowercaseDomain === "slides.google.com"
    ) {
      return "https://www.gstatic.com/images/branding/product/1x/slides_2020q4_48dp.png";
    }
    if (
      lowercaseDomain.includes("gmail.com") ||
      lowercaseDomain === "gmail.com"
    ) {
      return "https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_48dp.png";
    }
    if (
      lowercaseDomain.includes("calendar.google.com") ||
      lowercaseDomain === "calendar.google.com"
    ) {
      return "https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png";
    }
    if (
      lowercaseDomain.includes("github.com") ||
      lowercaseDomain === "github.com"
    ) {
      return "https://github.githubassets.com/favicons/favicon.ico";
    }
    if (
      lowercaseDomain.includes("konkuk.ac.kr") ||
      lowercaseDomain === "konkuk.ac.kr"
    ) {
      return "https://www.konkuk.ac.kr/favicon.ico";
    }

    // Fallback to DuckDuckGo Icon API (better than Google's)
    return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
  };

  const faviconUrl = getAccurateFaviconUrl(site.domain);
  const displayName = getDisplayName(site.domain);

  return (
    <div key={site.domain} className={styles.row}>
      <img
        src={faviconUrl}
        alt={displayName}
        className={styles.favicon}
        title={displayName}
        onError={(e) => {
          const src = e.currentTarget.src;
          // Try Google favicon as fallback
          if (!src.includes("google.com/s2/favicons")) {
            e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
              site.domain
            )}&sz=32`;
          } else {
            // Hide if all fail
            e.currentTarget.style.display = "none";
          }
        }}
      />
      <span className={styles.legendName}>
        {showDomain ? displayName : site.category ?? "기타"}
      </span>
      <div className={styles.time}>{formatedTime}</div>
      <div className={styles.pct}>{percentage}%</div>
      <button className={styles.open} onClick={() => onOpen?.(site.domain)}>
        열기
      </button>
    </div>
  );
};

export default Domain;

export type { ISite };
