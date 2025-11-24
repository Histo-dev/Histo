import { createRoot } from 'react-dom/client'
import './index.css'
import HeroIntro from './components/Hero/HeroIntro'

function PopupApp() {
  return (
    <div style={{ width: 360, padding: 8, display: 'flex', justifyContent: 'center' }}>
      <HeroIntro />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<PopupApp />)
