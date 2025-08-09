import { create } from 'zustand'
import type { SaveProfile } from './types'
import { loadProfile, saveProfile } from './save'

export type Screen = 'menu' | 'character' | 'track' | 'garage' | 'race'

type CharacterDef = { id: string; name: string; perk: 'Sprinter'|'Tank'|'Slick'|'Turbo' }

const characters: CharacterDef[] = [
  { id: 'sprinter', name: 'Sprinter', perk: 'Sprinter' },
  { id: 'tank', name: 'Tank', perk: 'Tank' },
  { id: 'slick', name: 'Slick', perk: 'Slick' },
  { id: 'turbo', name: 'Turbo', perk: 'Turbo' },
]

export type AppState = {
  screen: Screen
  profile: SaveProfile
  characters: CharacterDef[]
  selectedCharacterId: string
  selectedTrack: 'Sunny'
  setScreen: (s: Screen) => void
  selectCharacter: (id: string) => void
  selectTrack: (name: 'Sunny') => void
  updateProfile: (p: Partial<SaveProfile>) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'menu',
  profile: loadProfile(),
  characters,
  selectedCharacterId: 'sprinter',
  selectedTrack: 'Sunny',
  setScreen: (s) => set({ screen: s }),
  selectCharacter: (id) => set({ selectedCharacterId: id }),
  selectTrack: (name) => set({ selectedTrack: name }),
  updateProfile: (p) => {
    const next = { ...get().profile, ...p } as SaveProfile
    set({ profile: next })
    saveProfile(next)
  },
}))


