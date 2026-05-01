import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PersonaId } from '../data/learningPersonas'

export type Region = 'americas' | 'eu' | 'apac' | 'global'
export type ExperienceLevel = 'curious' | 'basics' | 'expert'
export type ViewAccess = 'gated' | 'preview' | 'unlocked'

interface PersonaState {
  selectedPersona: PersonaId | null
  hasSeenPersonaPicker: boolean
  selectedRegion: Region | null
  selectedIndustry: string | null
  selectedIndustries: string[]
  suppressSuggestion: boolean
  experienceLevel: ExperienceLevel | null
  viewAccess: ViewAccess
  setPersona: (persona: PersonaId | null) => void
  clearPersona: () => void
  markPickerSeen: () => void
  setRegion: (region: Region | null) => void
  setIndustry: (industry: string | null) => void
  setIndustries: (industries: string[]) => void
  setExperienceLevel: (level: ExperienceLevel | null) => void
  setViewAccess: (access: ViewAccess) => void
  /** Backwards-compat alias: true → 'unlocked', false → 'gated' */
  setAdvancedViewsUnlocked: (unlocked: boolean) => void
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
      viewAccess: 'unlocked',

      setPersona: (persona) =>
        set({
          selectedPersona: persona,
          hasSeenPersonaPicker: persona !== null,
          suppressSuggestion: true,
          // Curious starts in preview; all others are fully unlocked
          viewAccess: persona === 'curious' ? 'preview' : 'unlocked',
        }),

      clearPersona: () => set({ selectedPersona: null, hasSeenPersonaPicker: false }),

      markPickerSeen: () => set({ hasSeenPersonaPicker: true }),

      setRegion: (region) => set({ selectedRegion: region }),

      setIndustry: (industry) => set({ selectedIndustry: industry }),

      setIndustries: (industries) =>
        set({ selectedIndustries: industries, selectedIndustry: industries[0] ?? null }),

      setExperienceLevel: (level) => set({ experienceLevel: level }),

      setViewAccess: (access) => set({ viewAccess: access }),

      setAdvancedViewsUnlocked: (unlocked) => set({ viewAccess: unlocked ? 'unlocked' : 'gated' }),

      clearPreferences: () =>
        set({
          selectedPersona: null,
          selectedRegion: 'global',
          selectedIndustry: null,
          selectedIndustries: [],
          suppressSuggestion: true,
          experienceLevel: null,
          viewAccess: 'unlocked',
        }),
    }),
    {
      name: 'pqc-learning-persona',
      storage: createJSONStorage(() => localStorage),
      version: 4,
      migrate: (persisted: unknown, fromVersion: number) => {
        const s = (persisted ?? {}) as Record<string, unknown>
        if (fromVersion < 1) {
          s.experienceLevel = s.experienceLevel ?? null
        }
        if (fromVersion < 2) {
          // Rename 'new' → 'curious'
          if (s.experienceLevel === 'new') s.experienceLevel = 'curious'
        }
        if (fromVersion < 3) {
          s.advancedViewsUnlocked = s.advancedViewsUnlocked ?? true
        }
        if (fromVersion < 4) {
          // Convert boolean advancedViewsUnlocked → ViewAccess
          // true → 'unlocked' (preserve access); false → 'preview' (softer than before)
          const wasUnlocked = (s.advancedViewsUnlocked as boolean | undefined) !== false
          s.viewAccess = wasUnlocked ? 'unlocked' : 'preview'
          delete s.advancedViewsUnlocked
        }
        return s
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('usePersonaStore rehydrate error', error)
      },
    }
  )
)
