import './App.css'

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      gap:24,
      background:'#111'
    }}>
      <div className="extension-root">
        <div className="extension-panel" style={{ padding: 20 }}>
          <h2>Preview</h2>
        </div>
      </div>
    </div>
  )
}

export default App
