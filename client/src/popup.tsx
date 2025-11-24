import { createRoot } from 'react-dom/client'
import { useState } from 'react'

declare const chrome: any
import './index.css'
import Loading from './components/Hero/Loading'
import HeroIntro from './components/Hero/HeroIntro'
import Design1070 from './components/Hero/Design1070'

function PopupApp() {
  const [screen, setScreen] = useState<'intro' | 'loading' | 'design'>('intro')

  const startAnalysis = () => {
    setScreen('loading')
    try {
      // notify background to start analysis
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'start-analysis' }, (resp: any) => {
          // background acknowledged — we keep loading until analysis finishes
          console.log('background ack', resp)
        })
      }
    } catch (e) {
      console.error('sendMessage failed', e)
    }
  }

  return (
    <div className="extension-root">
      <div className="extension-panel">
        <div style={{ padding: '8px 12px', display: 'flex', gap: 8 }}>
          <button onClick={() => { setScreen('intro'); }} style={{ padding: '6px 8px', fontSize: 12 }}>Intro</button>
          <button onClick={() => { setScreen('loading'); }} style={{ padding: '6px 8px', fontSize: 12 }}>Loading</button>
          <button onClick={() => { setScreen('design'); }} style={{ padding: '6px 8px', fontSize: 12 }}>Design</button>
        </div>

        {screen === 'loading' ? (
          <Loading />
        ) : screen === 'design' ? (
          <Design1070 onBack={() => setScreen('intro')} />
        ) : (
          <HeroIntro onStart={startAnalysis} />
        )}
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<PopupApp />)
