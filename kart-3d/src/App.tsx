import { useEffect, useRef } from 'react'
import './App.css'
import { useAppStore } from './core/store'
import Menu from './ui/Menu'
import CharacterSelect from './ui/CharacterSelect'
import TrackSelect from './ui/TrackSelect'
import Garage from './ui/Garage'

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const screen = useAppStore(s => s.screen)

  useEffect(() => {
    let cleanup: (() => void) | undefined
    if (screen === 'race') {
      ;(async () => {
        const { startMinimalGame } = await import('./game/startMinimalGame')
        if (canvasRef.current) {
          cleanup = startMinimalGame(canvasRef.current)
        }
      })()
    }
    return () => {
      if (cleanup) cleanup()
    }
  }, [screen])

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      {screen === 'menu' && <Menu />}
      {screen === 'character' && <CharacterSelect />}
      {screen === 'track' && <TrackSelect />}
      {screen === 'garage' && <Garage />}
    </div>
  )
}

export default App
