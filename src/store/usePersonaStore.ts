import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PersonaId } from '../data/learningPersonas'
import { useHistoryStore } from './useHistoryStore'

export type Region = 'americas' | 'eu' | 'apac' | 'global'
export type ExperienceLevel = 'new' | 'basics' | 'expert'

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

      setPersona: (persona) => {
        set({
          selectedPersona: persona,
          hasSeenPersonaPicker: persona !== null,
          suppressSuggestion: true,
        })
        if (persona) {
          const labels: Record<string, string> = {
            executive: 'Executive / CISO',
            developer: 'Developer / Engineer',
            architect: 'Security Architect',
            researcher: 'Researcher / Academic',
          }
          try {
            useHistoryStore.getState().addEvent({
              type: 'persona_set',
              timestamp: Date.now(),
              title: `Selected persona: ${labels[persona] ?? persona}`,
              route: '/',
            })
          } catch {
            /* store not ready */
          }
        }
      },

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
      migrate: (persistedState: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = (persistedState ?? {}) as any

        // Ensure all expected fields exist with safe defaults
        state.selectedPersona = state.selectedPersona ?? null
        state.hasSeenPersonaPicker = state.hasSeenPersonaPicker ?? false
        state.selectedRegion = state.selectedRegion ?? 'global'
        state.selectedIndustry = state.selectedIndustry ?? null
        state.selectedIndustries = Array.isArray(state.selectedIndustries)
          ? state.selectedIndustries
          : []
        state.suppressSuggestion = state.suppressSuggestion ?? false
        state.experienceLevel = state.experienceLevel ?? null

        return state
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Persona store rehydration failed:', error)
        }
      },
    }
  )
)
