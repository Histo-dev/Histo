import { createRoot } from 'react-dom/client'
import './index.css'
import DashboardColumn from './components/Dashboard/DashboardColumn'

function OptionsApp() {
  return (
    <div style={{ padding: 18, maxWidth: 820 }}>
      <h1>Histo - 설정 및 대시보드</h1>
      <div style={{ display: 'flex', gap: 18, marginTop: 12 }}>
        <DashboardColumn />
        <div style={{ flex: 1 }}>
          <p>설정 및 상세 뷰를 여기에 추가합니다.</p>
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<OptionsApp />)
