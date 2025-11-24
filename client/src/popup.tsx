import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { MemoryRouter, Routes, Route, useNavigate} from 'react-router-dom'
declare const chrome: any
import './index.css'
import HistoIntro from './components/Home/HistoIntro'
import Loading from './components/Home/Loading'
import Analysis from './components/Analysis/Analysis'

const MIN_LOADING_MS = 1000  // 최소 로딩 유지 시간

function PopUpRoutes() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const startAnalysis = () => {
    setIsLoading(true)  // 로딩 시작
    const start = Date.now()
    
    chrome.runtime.sendMessage({ action: 'start-analysis' }, () => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed)
      setTimeout(() => {
        setIsLoading(false)  // 로딩 끝
        navigate('/analysis/overview')  // 결과로 이동
      }, remaining)
    })
  }

  if (isLoading) return <Loading />

  return (
    <Routes>
      <Route path="/" element={<HistoIntro onStart={startAnalysis}/>} />
      <Route path="/analysis/*" element={<Analysis onBack={() => navigate('/')}/>} />
    </Routes>
  )
}

function PopUpApp() {
  return (
    <div className="extension-root">
      <div className="extension-panel">
        <MemoryRouter>
          <PopUpRoutes />
        </MemoryRouter>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<PopUpApp />)
