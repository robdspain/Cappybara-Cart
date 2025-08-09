import type { SaveProfile } from '../core/types'

const STORAGE_KEY = 'turbokart_profile_v1'

export function loadProfile(): SaveProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    profileId: 'local-1',
    coins: 0,
    unlockedCharacters: ['Sprinter'],
    upgrades: { engine: 0, tires: 0, turbo: 0, armor: 0 },
    stats: { races: 0, wins: 0, bestLaps: {} },
    settings: { a11y: { shake: false, cbMode: 'off' }, input: 'keyboard', volume: 100, language: 'en' },
  }
}

export function saveProfile(p: SaveProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}


