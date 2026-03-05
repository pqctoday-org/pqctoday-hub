import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PersonaId } from '../data/learningPersonas'

export type Region = 'americas' | 'eu' | 'apac' | 'global'

interface PersonaState {
  selectedPersona: PersonaId | null
  hasSeenPersonaPicker: boolean
  selectedRegion: Region | null
  selectedIndustry: string | null
  selectedIndustries: string[]
  suppressSuggestion: boolean
  setPersona: (persona: PersonaId | null) => void
  clearPersona: () => void
  markPickerSeen: () => void
  setRegion: (region: Region | null) => void
  setIndustry: (industry: string | null) => void
  setIndustries: (industries: string[]) => void
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

      clearPreferences: () =>
        set({
          selectedPersona: null,
          selectedRegion: 'global',
          selectedIndustry: null,
          selectedIndustries: [],
          suppressSuggestion: true,
        }),
    }),
    {
      name: 'pqc-learning-persona',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
