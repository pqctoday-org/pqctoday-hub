import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PersonaId } from '../data/learningPersonas'
import type { NiceProficiencyTier } from '../data/niceFramework'

export type Region = 'americas' | 'eu' | 'mena' | 'apac' | 'global'
export type ExperienceLevel = 'curious' | 'basics' | 'expert'
export type ViewAccess = 'gated' | 'preview' | 'unlocked'

/** Default NICE proficiency tier per persona */
const PERSONA_DEFAULT_TIER: Record<string, NiceProficiencyTier> = {
  executive: 'awareness',
  curious: 'awareness',
  ops: 'practitioner',
  developer: 'practitioner',
  architect: 'practitioner',
  researcher: 'expert',
}

export function defaultTierForPersona(personaId: PersonaId | null): NiceProficiencyTier {
  if (!personaId) return 'awareness'
  return PERSONA_DEFAULT_TIER[personaId] ?? 'awareness'
}

interface PersonaState {
  selectedPersona: PersonaId | null
  hasSeenPersonaPicker: boolean
  selectedRegion: Region | null
  selectedIndustry: string | null
  selectedIndustries: string[]
  suppressSuggestion: boolean
  experienceLevel: ExperienceLevel | null
  viewAccess: ViewAccess
  /** NICE proficiency tier — overrides persona default when user manually selects */
  niceTier: NiceProficiencyTier
  /** Whether niceTier was manually overridden (false = derived from persona default) */
  niceTierOverridden: boolean
  /** Whether the curious-persona floating tour was completed or dismissed (CC-17) */
  curiousGuideDismissed: boolean
  setPersona: (persona: PersonaId | null) => void
  clearPersona: () => void
  markPickerSeen: () => void
  setRegion: (region: Region | null) => void
  setIndustry: (industry: string | null) => void
  setIndustries: (industries: string[]) => void
  setExperienceLevel: (level: ExperienceLevel | null) => void
  setViewAccess: (access: ViewAccess) => void
  setNiceTier: (tier: NiceProficiencyTier) => void
  resetNiceTier: () => void
  dismissCuriousGuide: () => void
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
      niceTier: 'awareness',
      niceTierOverridden: false,
      curiousGuideDismissed: false,

      setPersona: (persona) =>
        set((state) => ({
          selectedPersona: persona,
          hasSeenPersonaPicker: persona !== null,
          suppressSuggestion: true,
          // Curious starts in preview; all others are fully unlocked
          viewAccess: persona === 'curious' ? 'preview' : 'unlocked',
          // Reset tier to persona default unless user already overrode it
          niceTier: state.niceTierOverridden ? state.niceTier : defaultTierForPersona(persona),
          niceTierOverridden: state.niceTierOverridden,
        })),

      clearPersona: () =>
        set({ selectedPersona: null, hasSeenPersonaPicker: false, niceTierOverridden: false }),

      markPickerSeen: () => set({ hasSeenPersonaPicker: true }),

      setRegion: (region) => set({ selectedRegion: region }),

      setIndustry: (industry) => set({ selectedIndustry: industry }),

      setIndustries: (industries) =>
        set({ selectedIndustries: industries, selectedIndustry: industries[0] ?? null }),

      setExperienceLevel: (level) => set({ experienceLevel: level }),

      setViewAccess: (access) => set({ viewAccess: access }),

      setNiceTier: (tier) => set({ niceTier: tier, niceTierOverridden: true }),

      resetNiceTier: () =>
        set((state) => ({
          niceTier: defaultTierForPersona(state.selectedPersona),
          niceTierOverridden: false,
        })),

      dismissCuriousGuide: () => set({ curiousGuideDismissed: true }),

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
          niceTier: 'awareness',
          niceTierOverridden: false,
          curiousGuideDismissed: false,
        }),
    }),
    {
      name: 'pqc-learning-persona',
      storage: createJSONStorage(() => localStorage),
      version: 7,
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
        if (fromVersion < 5) {
          // MENA split: Israel/UAE/Saudi/Bahrain/Jordan moved out of 'eu' into 'mena'.
          // Persona store only persists selectedRegion (not country), so existing
          // 'eu' values remain valid. The companion assessment store carries the
          // country and reassigns on next region change via handleRegion().
        }
        if (fromVersion < 6) {
          // Add NICE proficiency tier fields — default from persona if known.
          const persona = (s.selectedPersona as string | null) ?? null
          s.niceTier = PERSONA_DEFAULT_TIER[persona ?? ''] ?? 'awareness'
          s.niceTierOverridden = false
        }
        if (fromVersion < 7) {
          // CC-17: track whether the curious-persona floating tour was dismissed.
          s.curiousGuideDismissed = s.curiousGuideDismissed ?? false
        }
        return s
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('usePersonaStore rehydrate error', error)
      },
    }
  )
)
