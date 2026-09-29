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
  'cert-engineer': 'expert',
  grc: 'practitioner',
}

export function defaultTierForPersona(personaId: PersonaId | null): NiceProficiencyTier {
  if (!personaId) return 'awareness'
  // eslint-disable-next-line security/detect-object-injection -- personaId is the typed PersonaId union, not user input
  return PERSONA_DEFAULT_TIER[personaId] ?? 'awareness'
}

interface PersonaState {
  selectedPersona: PersonaId | null
  hasSeenPersonaPicker: boolean
  /**
   * True once the user has explicitly chosen NOT to pick a persona (e.g. Role
   * Home's "Show me everything" footer button), distinct from simply never
   * having picked one yet. `selectedPersona === null && hasSeenPersonaPicker
   * === false` is what should show Role Home; this flag lets a caller say
   * "don't show Role Home again" without touching either of those two fields
   * or repurposing `setPersona(null)` (which already means something else —
   * see `clearPersona`).
   */
  hasSkippedPersonalization: boolean
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
  /**
   * Algorithms-page tabs the user has visited at least once. P2.3 uses this
   * to gate the Protocol Support tab for the curious persona — they must
   * visit Transition or Detailed before the third tab becomes available.
   */
  algorithmsTabsVisited: string[]
  /** Whether the user has completed the Executive Overview walkthrough (the guided tour). */
  execOverviewSeen: boolean
  /**
   * True once the user has seen (and dismissed, kept Executive, or switched to
   * GRC from) the one-time Executive/GRC split notice — see `migrate` v11 and
   * `acknowledgeExecutiveGrcSplit` below. Fresh stores start `true` (nothing to
   * acknowledge); only pre-v11 stores whose selected persona was `executive`
   * migrate in as `false` so the notice shows exactly once for legacy Executive
   * users, never for anyone who never touched the old combined role.
   */
  hasAcknowledgedExecutiveGrcSplit: boolean
  setPersona: (persona: PersonaId | null) => void
  clearPersona: () => void
  markPickerSeen: () => void
  /** Explicitly opt out of personalization without selecting a persona — see
   *  `hasSkippedPersonalization` above. Leaves `selectedPersona` and
   *  `hasSeenPersonaPicker` untouched. */
  skipPersonalization: () => void
  setRegion: (region: Region | null) => void
  setIndustry: (industry: string | null) => void
  setIndustries: (industries: string[]) => void
  setExperienceLevel: (level: ExperienceLevel | null) => void
  setViewAccess: (access: ViewAccess) => void
  setNiceTier: (tier: NiceProficiencyTier) => void
  resetNiceTier: () => void
  dismissCuriousGuide: () => void
  markAlgorithmsTabVisited: (tab: string) => void
  setExecOverviewSeen: (seen: boolean) => void
  /** Marks the Executive/GRC split notice as seen — see `hasAcknowledgedExecutiveGrcSplit`. */
  acknowledgeExecutiveGrcSplit: () => void
  /** Backwards-compat alias: true → 'unlocked', false → 'gated' */
  setAdvancedViewsUnlocked: (unlocked: boolean) => void
  clearPreferences: () => void
}

export const usePersonaStore = create<PersonaState>()(
  persist(
    (set) => ({
      selectedPersona: null,
      hasSeenPersonaPicker: false,
      hasSkippedPersonalization: false,
      selectedRegion: 'global' as Region,
      selectedIndustry: null,
      selectedIndustries: [],
      suppressSuggestion: false,
      experienceLevel: null,
      viewAccess: 'unlocked',
      niceTier: 'awareness',
      niceTierOverridden: false,
      curiousGuideDismissed: false,
      algorithmsTabsVisited: [],
      execOverviewSeen: false,
      hasAcknowledgedExecutiveGrcSplit: true,

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

      skipPersonalization: () => set({ hasSkippedPersonalization: true }),

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

      markAlgorithmsTabVisited: (tab) =>
        set((state) => {
          if (state.algorithmsTabsVisited.includes(tab)) return state
          return { algorithmsTabsVisited: [...state.algorithmsTabsVisited, tab] }
        }),

      setExecOverviewSeen: (seen) => set({ execOverviewSeen: seen }),

      acknowledgeExecutiveGrcSplit: () => set({ hasAcknowledgedExecutiveGrcSplit: true }),

      setAdvancedViewsUnlocked: (unlocked) => set({ viewAccess: unlocked ? 'unlocked' : 'gated' }),

      clearPreferences: () =>
        set({
          selectedPersona: null,
          hasSkippedPersonalization: false,
          selectedRegion: 'global',
          selectedIndustry: null,
          selectedIndustries: [],
          suppressSuggestion: true,
          experienceLevel: null,
          viewAccess: 'unlocked',
          niceTier: 'awareness',
          niceTierOverridden: false,
          curiousGuideDismissed: false,
          algorithmsTabsVisited: [],
          hasAcknowledgedExecutiveGrcSplit: true,
        }),
    }),
    {
      name: 'pqc-learning-persona',
      storage: createJSONStorage(() => localStorage),
      version: 11,
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
        if (fromVersion < 8) {
          // P2.3: track algorithms-page tab visits to gate Protocol Support
          // for the curious persona. Default empty array so the gate engages
          // until the user actually visits Transition or Detailed.
          s.algorithmsTabsVisited = Array.isArray(s.algorithmsTabsVisited)
            ? s.algorithmsTabsVisited
            : []
        }
        if (fromVersion < 9) {
          // Executive Overview walkthrough completion flag.
          s.execOverviewSeen = s.execOverviewSeen ?? false
        }
        if (fromVersion < 10) {
          // Role Home escape hatch: "chose not to pick a persona" is distinct
          // from "never picked one yet" — default false preserves existing
          // Role Home behavior for every already-persisted user.
          s.hasSkippedPersonalization = s.hasSkippedPersonalization ?? false
        }
        if (fromVersion < 11) {
          // Executive/GRC split (2026-09-07): only a pre-v11 store whose
          // selected persona was 'executive' has anything to acknowledge — the
          // combined role they picked no longer exists as-is. Everyone else
          // (other personas, or no persona chosen yet) gets `true` so the
          // one-time notice never shows for someone it doesn't apply to.
          //
          // A real pre-v11 store never had this key at all, so this branch is
          // exactly the "no explicit value yet" case for actual users. Only
          // an already-boolean value here (impossible pre-v11 in practice,
          // but a legitimate way for a test fixture to seed a settled,
          // already-acknowledged 'executive' store without also bumping its
          // seeded version) is left alone rather than overwritten.
          if (typeof s.hasAcknowledgedExecutiveGrcSplit !== 'boolean') {
            s.hasAcknowledgedExecutiveGrcSplit = s.selectedPersona !== 'executive'
          }
        }
        return s
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('usePersonaStore rehydrate error', error)
      },
    }
  )
)
