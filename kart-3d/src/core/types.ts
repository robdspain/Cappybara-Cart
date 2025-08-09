export type SurfaceType = 'tarmac' | 'pad' | 'mud' | 'curb' | 'ramp'

export type KartStats = {
  accel: number
  topSpeed: number
  handling: number
  boostCap: number
  mass: number
}

export type DdaScales = {
  topSpeedScale: number
  gripScale: number
}

export type SaveProfile = {
  profileId: string
  coins: number
  unlockedCharacters: string[]
  upgrades: { engine: number; tires: number; turbo: number; armor: number }
  stats: { races: number; wins: number; bestLaps: Record<string, number> }
  settings: {
    a11y: { shake: boolean; cbMode: 'off' | 'protan' | 'deutan' | 'tritan' }
    input: 'keyboard' | 'gamepad'
    volume: number
    language: 'en' | 'es' | 'fr'
  }
}

