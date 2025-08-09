import { useAppStore } from '../core/store'

export default function Garage() {
  const { profile, updateProfile, setScreen } = useAppStore()
  const { engine, tires, turbo, armor } = profile.upgrades
  const coins = profile.coins
  function buy(kind: 'engine'|'tires'|'turbo'|'armor') {
    const costs = { engine: [80,140,220], tires: [70,120,180], turbo: [60,100,160], armor: [90,160] }
    const levels = { engine, tires, turbo, armor }
    const level = (levels as any)[kind] as number
    const cost = (costs as any)[kind][level]
    if (cost == null || coins < cost) return
    const next = { ...profile }
    ;(next.upgrades as any)[kind] = level + 1
    next.coins = coins - cost
    updateProfile(next)
  }
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', padding: 24, borderRadius: 12, minWidth: 480 }}>
        <h3 style={{ marginTop: 0 }}>Garage</h3>
        <div>Coins: {coins}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, marginTop: 12 }}>
          <div>Engine (lvl {engine})</div><div></div><button onClick={() => buy('engine')}>Upgrade</button>
          <div>Tires (lvl {tires})</div><div></div><button onClick={() => buy('tires')}>Upgrade</button>
          <div>Turbo (lvl {turbo})</div><div></div><button onClick={() => buy('turbo')}>Upgrade</button>
          <div>Armor (lvl {armor})</div><div></div><button onClick={() => buy('armor')}>Upgrade</button>
        </div>
        <div style={{ marginTop: 16 }}>
          <button onClick={() => setScreen('menu')}>Back</button>
        </div>
      </div>
    </div>
  )
}


