import { useEffect, useRef } from 'react'
import { useAppStore } from '../core/store'

export default function Splash() {
  const setScreen = useAppStore(s => s.setScreen)
  const titleRef = useRef<HTMLDivElement | null>(null)
  const subRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setScreen('loading'), 2200)
    return () => clearTimeout(t)
  }, [setScreen])

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0a0a12', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(1200px 700px at 50% 40%, rgba(255,255,100,0.05), rgba(0,0,0,0.9))' }} />
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div
          ref={titleRef}
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 800,
            letterSpacing: 2,
            color: '#ffe36e',
            textShadow: '0 0 10px #ffb000, 0 0 24px #f60',
            fontSize: '64px',
            filter: 'contrast(1.2) saturate(1.2)',
            transform: 'scale(0.9)',
            animation: 'crtPop 1200ms ease-out forwards',
          }}
        >
          CAPPYBARA CART
        </div>
        <div
          ref={subRef}
          style={{
            marginTop: 8,
            color: '#8ad8ff',
            textShadow: '0 0 10px #00c8ff',
            fontWeight: 700,
            letterSpacing: 4,
            fontSize: '16px',
            animation: 'scan 1800ms ease-in-out infinite',
          }}
        >
          32-BIT EDITION
        </div>
      </div>
      <style>
        {`
        @keyframes crtPop { 0% { opacity: 0; transform: scale(0.5) rotate(-1deg); filter: blur(4px);} 60% { opacity: 1; transform: scale(1.08); filter: blur(0);} 100% { transform: scale(1); } }
        @keyframes scan { 0%,100% { opacity: 0.8; filter: drop-shadow(0 0 8px #0ff); } 50% { opacity: 1; filter: drop-shadow(0 0 16px #0ff); } }
        `}
      </style>
      <div style={{ position: 'absolute', bottom: 20, color: '#fff', opacity: 0.6, fontSize: 12 }}>© Cappybara Kart</div>
    </div>
  )
}


