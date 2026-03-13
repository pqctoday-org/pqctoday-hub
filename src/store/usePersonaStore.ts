import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PersonaId } from '../data/learningPersonas'

export type Region = 'americas' | 'eu' | 'apac' | 'global'
export type ExperienceLevel = 'curious' | 'basics' | 'expert'

interface PersonaState {
  selectedPersona: PersonaId | null
  hasSeenPersonaPicker: boolean
  selectedRegion: Region | null
  selectedIndustry: string | null
  selectedIndustries: string[]
  suppressSuggestion: boolean
  experienceLevel: ExperienceLevel | null
  setPersona: (persona: PersonaId | null) => void
  clearPersona: () => void
  markPickerSeen: () => void
  setRegion: (region: Region | null) => void
  setIndustry: (industry: string | null) => void
  setIndustries: (industries: string[]) => void
  setExperienceLevel: (level: ExperienceLevel | null) => void
  clearPreferences: () => void
}

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set) => ({
      selectedPersona: null,
      hasSeenPersonaPicker: false,
      selectedRegion: 'global' as Region,
      selectedIndustry: null,
      selectedIndustries: [],
      suppressSuggestion: false,
      experienceLevel: null,

      setPersona: (persona) =>
        set({
          selectedPersona: persona,
          hasSeenPersonaPicker: persona !== null,
          suppressSuggestion: true,
        }),

      clearPersona: () => set({ selectedPersona: null, hasSeenPersonaPicker: false }),

      markPickerSeen: () => set({ hasSeenPersonaPicker: true }),

      setRegion: (region) => set({ selectedRegion: region }),

      setIndustry: (industry) => set({ selectedIndustry: industry }),

      setIndustries: (industries) =>
        set({ selectedIndustries: industries, selectedIndustry: industries[0] ?? null }),

      setExperienceLevel: (level) => set({ experienceLevel: level }),

      clearPreferences: () =>
        set({
          selectedPersona: null,
          selectedRegion: 'global',
          selectedIndustry: null,
          selectedIndustries: [],
          suppressSuggestion: true,
          experienceLevel: null,
        }),
    }),
    {
      name: 'pqc-learning-persona',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted: unknown, fromVersion: number) => {
        const s = (persisted ?? {}) as Record<string, unknown>
        if (fromVersion < 1) {
          s.experienceLevel = s.experienceLevel ?? null
        }
        if (fromVersion < 2) {
          // Rename 'new' → 'curious'
          if (s.experienceLevel === 'new') s.experienceLevel = 'curious'
        }
        return s
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('usePersonaStore rehydrate error', error)
      },
    }
  )
)
