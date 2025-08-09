import { useEffect, useState } from 'react'
import { useAppStore } from '../core/store'

export default function Loading() {
  const setScreen = useAppStore(s => s.setScreen)
  const [dots, setDots] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setDots(d => (d + 1) % 4), 350)
    const t = setTimeout(() => setScreen('menu'), 2200)
    return () => { clearInterval(id); clearTimeout(t) }
  }, [setScreen])
  const text = `LOADING${'.'.repeat(dots)}`
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#101014', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,220,0,0.06), rgba(0,0,0,0.9))' }} />
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 900,
          letterSpacing: 6,
          color: '#ffd400',
          textShadow: '0 0 10px #ffea00, 0 0 24px #ff9800',
          fontSize: '34px',
          animation: 'wiggle 1.2s ease-in-out infinite',
        }}>{text}</div>
        <div style={{ marginTop: 8, color: '#fff', opacity: 0.5, fontSize: 12 }}>Preparing track and assets...</div>
      </div>
      <style>
        {`
        @keyframes wiggle { 0%,100% { transform: translateY(0) skewX(0deg); } 25% { transform: translateY(-2px) skewX(1deg); } 50% { transform: translateY(0) skewX(0deg);} 75% { transform: translateY(1px) skewX(-1deg);} }
        `}
      </style>
    </div>
  )
}


