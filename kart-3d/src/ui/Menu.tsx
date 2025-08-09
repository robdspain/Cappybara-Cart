import { useState } from 'react'
import { useAppStore } from '../core/store'

export default function Menu() {
  const setScreen = useAppStore(s => s.setScreen)
  const { profile, updateProfile } = useAppStore()
  const [showOptions, setShowOptions] = useState(false)
  const [showLeaders, setShowLeaders] = useState(false)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(1200px 600px at 50% 0%, rgba(255,255,255,0.04), rgba(0,0,0,0.86))', animation: 'bgPan 18s linear infinite' as any, zIndex: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'conic-gradient(from 0deg at 50% 10%, rgba(255,0,128,0.08), rgba(0,200,255,0.06), rgba(255,230,0,0.08), rgba(0,255,150,0.06), rgba(255,0,128,0.08))' }} />
      <style>{`
        @keyframes bgPan{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}
        .btn{padding:12px 14px;border-radius:12px;border:0;color:#111;font-weight:800;letter-spacing:.3px;cursor:pointer;box-shadow:0 2px 0 rgba(0,0,0,.35) inset,0 8px 24px rgba(0,0,0,.35);transition:transform .12s ease, filter .12s ease}
        .btn:hover{transform:translateY(-1px);filter:saturate(1.2)}
        .btn:active{transform:translateY(0)}
      `}</style>
      <div style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: 24, borderRadius: 16, minWidth: 420, boxShadow: '0 10px 40px rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', transition: 'transform .25s, opacity .25s' }}>
        <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 36, background: 'linear-gradient(90deg,#00d0ff,#ffd400,#ff3bd4)', WebkitBackgroundClip: 'text', color: 'transparent' as any }}>Project TurboKart</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          <button onClick={() => setScreen('character')} className="btn" style={{ background: 'linear-gradient(180deg,#00e1ff,#00b7ff)', color: '#00121a' }}>Single-Player</button>
          <button disabled className="btn" style={{ background: 'linear-gradient(180deg,#3b3b3b,#2a2a2a)', color: '#9aa0a6', opacity: 0.6 }}>Multiplayer (coming soon)</button>
          <button onClick={() => setScreen('garage')} className="btn" style={{ background: 'linear-gradient(180deg,#66ff9a,#06d67a)', color: '#002315' }}>Garage</button>
          <button onClick={() => setShowOptions(true)} className="btn" style={{ background: 'linear-gradient(180deg,#ffd44d,#ff9d00)', color: '#2a1600' }}>Options</button>
          <button onClick={() => setShowLeaders(true)} className="btn" style={{ background: 'linear-gradient(180deg,#ff72ff,#b05cff)', color: '#1b0022' }}>Leaderboards</button>
        </div>
      </div>

      {showOptions && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)' }}>
          <div style={{ background: 'rgba(20,20,24,0.95)', color: '#fff', padding: 20, borderRadius: 12, minWidth: 360, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: 18, marginBottom: 12 }}>Options</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12 }}>
                <span>Volume</span>
                <input type="range" min={0} max={100} defaultValue={(profile.settings as any).volume ?? 100} onChange={(e) => updateProfile({ settings: { ...(profile.settings as any), volume: Number((e.target as HTMLInputElement).value) } as any })} />
              </label>
              <label style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12 }}>
                <span>Input</span>
                <select defaultValue={profile.settings.input} onChange={(e) => updateProfile({ settings: { ...profile.settings, input: e.currentTarget.value as any } })}>
                  <option value="keyboard">keyboard</option>
                  <option value="gamepad">gamepad</option>
                </select>
              </label>
              <label style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12 }}>
                <span>Language</span>
                <select defaultValue={(profile.settings as any).language ?? 'en'} onChange={(e) => updateProfile({ settings: { ...(profile.settings as any), language: e.currentTarget.value as any } })}>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </label>
            </div>
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <button onClick={() => setShowOptions(false)} style={{ padding: '8px 12px', borderRadius: 8, border: 0, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showLeaders && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)' }}>
          <div style={{ background: 'rgba(20,20,24,0.95)', color: '#fff', padding: 20, borderRadius: 12, minWidth: 360, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: 18, marginBottom: 12 }}>Leaderboards</div>
            <div style={{ opacity: 0.8 }}>Coming soon</div>
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <button onClick={() => setShowLeaders(false)} style={{ padding: '8px 12px', borderRadius: 8, border: 0, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


