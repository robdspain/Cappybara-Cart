import { useState } from 'react'
import { useAppStore } from '../core/store'

export default function Menu() {
  const setScreen = useAppStore(s => s.setScreen)
  const { profile, updateProfile } = useAppStore()
  const [showOptions, setShowOptions] = useState(false)
  const [showLeaders, setShowLeaders] = useState(false)
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(1200px 600px at 50% 0%, rgba(255,255,255,0.05), rgba(0,0,0,0.9))', animation: 'bgPan 18s linear infinite' as any, zIndex: 0 }} />
      <style>{`@keyframes bgPan{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}`}</style>
      <div style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: 24, borderRadius: 12, minWidth: 360, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', transition: 'transform .25s, opacity .25s' }}>
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Project TurboKart</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          <button onClick={() => setScreen('character')} style={{ padding: '10px 12px', borderRadius: 8, border: 0, cursor: 'pointer' }}>Single-Player</button>
          <button disabled style={{ padding: '10px 12px', borderRadius: 8, border: 0, opacity: 0.5 }}>Multiplayer (coming soon)</button>
          <button onClick={() => setScreen('garage')} style={{ padding: '10px 12px', borderRadius: 8, border: 0, cursor: 'pointer' }}>Garage</button>
          <button onClick={() => setShowOptions(true)} style={{ padding: '10px 12px', borderRadius: 8, border: 0, cursor: 'pointer' }}>Options</button>
          <button onClick={() => setShowLeaders(true)} style={{ padding: '10px 12px', borderRadius: 8, border: 0, cursor: 'pointer' }}>Leaderboards</button>
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


