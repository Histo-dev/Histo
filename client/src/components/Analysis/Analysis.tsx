import { useEffect } from 'react';
import styles from './Analysis.module.css';
import Header from './AnalysisMeta/Header';
import InnerTabs, { type TabKey } from './InnerTabs';
import StatCards from './AnalysisMeta/StatCards';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import Overview from './Overview/Overview';
import TopN from './TopN/TopN';
import Detail from './Detail/Detail';
import useUsageStore, { type UsageState } from '../../store/usageStore';

declare const chrome: any;

type Props = {
  onBack?: () => void;
};

export default function Analysis({ onBack }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = location.pathname.split('/').pop() || 'overview';
  const fetchFromStorage = useUsageStore((s: UsageState) => s.fetchFromStorage);

  useEffect(() => {
    fetchFromStorage();
    // 실시간 storage 이벤트는 background가 매우 자주 쓰는 경우 루프를 유발할 수 있어, 팝업이 열린 시점에 한 번만 읽습니다.
  }, [fetchFromStorage]);

  const changeTab = (t: TabKey) => navigate(`/analysis/${t}`);

  return (
    <div className={styles.shell}>
      <Header
        onBack={onBack}
        title='브라우저 활동'
        subtitle='오늘의 웹 사용 분석'
        icon='network.svg'
      />
      <StatCards />
      <InnerTabs selected={currentTab as TabKey} onSelect={(t) => changeTab(t)} />

      <Routes>
        <Route path='overview' element={<Overview />} />
        <Route path='topN' element={<TopN />} />
        <Route path='detail' element={<Detail />} />
      </Routes>
    </div>
  );
}
