import styles from "./Analysis.module.css";
import Header from "./AnalysisMeta/Header";
import InnerTabs, { type TabKey } from "./InnerTabs";
import StatCards from "./AnalysisMeta/StatCards";
import { useLocation, useNavigate, Routes, Route } from "react-router-dom";
import Overview from "./Overview/Overview";
import TopN from "./TopN/TopN";
import Detail from "./Detail/Detail";

type Props = {
  onBack?: () => void;
};

export default function Analysis({ onBack }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = location.pathname.split("/").pop() || "overview";

  const changeTab = (t: TabKey) => navigate(`/analysis/${t}`);

  // Detail 페이지는 전체 화면으로 렌더링
  const isDetailPage = currentTab === "detail";

  if (isDetailPage) {
    return (
      <Routes>
        <Route path="detail" element={<Detail />} />
      </Routes>
    );
  }

  return (
    <div className={styles.shell}>
      <Header
        onBack={onBack}
        title="브라우저 활동"
        subtitle="오늘의 웹 사용 분석"
        icon="network.svg"
      />
      <StatCards />
      <InnerTabs
        selected={currentTab as TabKey}
        onSelect={(t) => changeTab(t)}
      />

      <Routes>
        <Route path="overview" element={<Overview />} />
        <Route path="topN" element={<TopN />} />
      </Routes>
    </div>
  );
}
