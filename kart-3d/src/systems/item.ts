import weights from '../content/weights.json'

type ItemName = 'Boost' | 'Homing' | 'Banana' | 'Shield' | 'Lightning' | 'Triples'

export function getWeightsFor(position: number): Record<ItemName, number> {
  const band = (weights.bands as Array<{ range: [number, number]; weights: Record<ItemName, number> }>).find(
    (b) => position >= b.range[0] && position <= b.range[1]
  )
  return band ? band.weights : (weights.bands[weights.bands.length - 1].weights as Record<ItemName, number>)
}

export function weightedRandom(table: Record<ItemName, number>): ItemName {
  const entries = Object.entries(table) as Array<[ItemName, number]>
  const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0)
  let r = Math.random() * total
  for (const [name, w] of entries) {
    r -= Math.max(0, w)
    if (r <= 0) return name
  }
  return entries[0][0]
}

export function rollItem(position: number, lastLightningTime: number): ItemName {
  const table = { ...getWeightsFor(position) }
  const pity = (weights.cooldowns as any).Lightning ?? 20000
  if (Date.now() - lastLightningTime < pity) table.Lightning = 0
  return weightedRandom(table)
}


