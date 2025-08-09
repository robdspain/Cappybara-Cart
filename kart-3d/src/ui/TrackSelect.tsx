import { useAppStore } from '../core/store'

export default function TrackSelect() {
  const { selectedTrack, selectTrack, setScreen } = useAppStore()
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', padding: 24, borderRadius: 12, minWidth: 420 }}>
        <h3 style={{ marginTop: 0 }}>Choose Track</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          {['Sunny'].map(name => (
            <button key={name} onClick={() => selectTrack(name as 'Sunny')} style={{ padding: 12, borderRadius: 8, border: selectedTrack === name ? '2px solid #0ff' : '1px solid #444' }}>
              {name}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setScreen('race')}>Start Race</button>
          <button onClick={() => setScreen('character')} style={{ marginLeft: 12 }}>Back</button>
        </div>
      </div>
    </div>
  )
}


