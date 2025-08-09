import { useAppStore } from '../core/store'

export default function CharacterSelect() {
  const { characters, selectedCharacterId, selectCharacter, setScreen } = useAppStore()
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', padding: 24, borderRadius: 12, minWidth: 420 }}>
        <h3 style={{ marginTop: 0 }}>Choose Character</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          {characters.map(c => (
            <button key={c.id} onClick={() => selectCharacter(c.id)} style={{ padding: 12, borderRadius: 8, border: selectedCharacterId === c.id ? '2px solid #0ff' : '1px solid #444' }}>
              {c.name}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setScreen('track')}>Continue</button>
          <button onClick={() => setScreen('menu')} style={{ marginLeft: 12 }}>Back</button>
        </div>
      </div>
    </div>
  )
}


