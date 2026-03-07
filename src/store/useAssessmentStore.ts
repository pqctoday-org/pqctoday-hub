// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AssessmentInput, CategoryScores } from '../hooks/assessmentTypes'
import type { AssessmentResult } from '../hooks/assessmentTypes'
import { usePersonaStore } from './usePersonaStore'
import { useHistoryStore } from './useHistoryStore'
import { computeSmartDefaults } from '../components/Assess/smartDefaults'

export type AssessmentMode = 'quick' | 'comprehensive'
export type AssessmentStatus = 'not-started' | 'in-progress' | 'complete'

export interface AssessmentSnapshot {
  completedAt: string
  riskScore: number
  categoryScores: CategoryScores
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  industry: string
}

interface AssessmentState {
  currentStep: number
  assessmentMode: AssessmentMode | null
  industry: string
  country: string
  currentCrypto: string[]
  currentCryptoCategories: string[]
  cryptoUnknown: boolean
  dataSensitivity: string[]
  sensitivityUnknown: boolean
  complianceRequirements: string[]
  complianceUnknown: boolean
  migrationStatus: AssessmentInput['migrationStatus'] | ''
  migrationUnknown: boolean
  // Extended fields
  cryptoUseCases: string[]
  useCasesUnknown: boolean
  dataRetention: string[]
  retentionUnknown: boolean
  credentialLifetime: string[]
  credentialLifetimeUnknown: boolean
  systemCount: NonNullable<AssessmentInput['systemCount']> | ''
  teamSize: NonNullable<AssessmentInput['teamSize']> | ''
  cryptoAgility: NonNullable<AssessmentInput['cryptoAgility']> | ''
  agilityUnknown: boolean
  infrastructure: string[]
  infrastructureUnknown: boolean
  infrastructureSubCategories: Record<string, string[]>
  vendorDependency: NonNullable<AssessmentInput['vendorDependency']> | ''
  vendorUnknown: boolean
  timelinePressure: NonNullable<AssessmentInput['timelinePressure']> | ''
  timelineUnknown: boolean
  // Import toggles — sync wizard selections with page stores
  importComplianceSelection: boolean
  importProductSelection: boolean
  // Report preferences
  hiddenThreats: string[]
  // Control state
  assessmentStatus: AssessmentStatus
  lastResult: AssessmentResult | null
  lastWizardUpdate: string | null
  completedAt: string | null
  lastModifiedAt: string | null
  previousRiskScore: number | null
  assessmentHistory: AssessmentSnapshot[]
  // Actions
  setStep: (step: number) => void
  setAssessmentMode: (mode: AssessmentMode) => void
  setIndustry: (industry: string) => void
  setCountry: (country: string) => void
  toggleCrypto: (algo: string) => void
  toggleCryptoCategory: (cat: string) => void
  setCryptoUnknown: (val: boolean) => void
  toggleDataSensitivity: (level: string) => void
  setSensitivityUnknown: (val: boolean) => void
  toggleCompliance: (framework: string) => void
  setComplianceRequirements: (requirements: string[]) => void
  setComplianceUnknown: (val: boolean) => void
  setMigrationStatus: (status: AssessmentInput['migrationStatus']) => void
  setMigrationUnknown: (val: boolean) => void
  toggleCryptoUseCase: (useCase: string) => void
  setUseCasesUnknown: (val: boolean) => void
  toggleDataRetention: (value: string) => void
  setRetentionUnknown: (val: boolean) => void
  toggleCredentialLifetime: (value: string) => void
  setCredentialLifetimeUnknown: (val: boolean) => void
  setSystemCount: (count: NonNullable<AssessmentInput['systemCount']>) => void
  setTeamSize: (size: NonNullable<AssessmentInput['teamSize']>) => void
  setCryptoAgility: (agility: NonNullable<AssessmentInput['cryptoAgility']>) => void
  setAgilityUnknown: (val: boolean) => void
  toggleInfrastructure: (item: string) => void
  setInfrastructureUnknown: (val: boolean) => void
  setInfrastructureSubCategory: (layer: string, cats: string[]) => void
  setVendorDependency: (dep: NonNullable<AssessmentInput['vendorDependency']>) => void
  setVendorUnknown: (val: boolean) => void
  setTimelinePressure: (pressure: NonNullable<AssessmentInput['timelinePressure']>) => void
  setTimelineUnknown: (val: boolean) => void
  setImportComplianceSelection: (val: boolean) => void
  setImportProductSelection: (val: boolean) => void
  hideThreat: (threatId: string) => void
  restoreThreat: (threatId: string) => void
  restoreAllThreats: () => void
  markComplete: () => void
  setResult: (result: AssessmentResult) => void
  pushSnapshot: (snapshot: AssessmentSnapshot) => void
  editFromStep: (step: number) => void
  reset: () => void
  getInput: () => AssessmentInput | null
}

const INITIAL_STATE = {
  currentStep: 0,
  assessmentMode: null as AssessmentMode | null,
  industry: '',
  country: '',
  currentCrypto: [] as string[],
  currentCryptoCategories: [] as string[],
  cryptoUnknown: false,
  dataSensitivity: [] as string[],
  sensitivityUnknown: false,
  complianceRequirements: [] as string[],
  complianceUnknown: false,
  migrationStatus: '' as AssessmentInput['migrationStatus'] | '',
  migrationUnknown: false,
  cryptoUseCases: [] as string[],
  useCasesUnknown: false,
  dataRetention: [] as string[],
  retentionUnknown: false,
  credentialLifetime: [] as string[],
  credentialLifetimeUnknown: false,
  systemCount: '' as NonNullable<AssessmentInput['systemCount']> | '',
  teamSize: '' as NonNullable<AssessmentInput['teamSize']> | '',
  cryptoAgility: '' as NonNullable<AssessmentInput['cryptoAgility']> | '',
  agilityUnknown: false,
  infrastructure: [] as string[],
  infrastructureUnknown: false,
  infrastructureSubCategories: {} as Record<string, string[]>,
  vendorDependency: '' as NonNullable<AssessmentInput['vendorDependency']> | '',
  vendorUnknown: false,
  timelinePressure: '' as NonNullable<AssessmentInput['timelinePressure']> | '',
  timelineUnknown: false,
  importComplianceSelection: true,
  importProductSelection: true,
  hiddenThreats: [] as string[],
  assessmentStatus: 'not-started' as AssessmentStatus,
  lastResult: null as AssessmentResult | null,
  lastWizardUpdate: null as string | null,
  completedAt: null as string | null,
  lastModifiedAt: null as string | null,
  previousRiskScore: null as number | null,
  assessmentHistory: [] as AssessmentSnapshot[],
}

/** Check if any step currently has its unknown flag set. */
function hasAnyUnknown(state: AssessmentState): boolean {
  return (
    state.cryptoUnknown ||
    state.sensitivityUnknown ||
    state.complianceUnknown ||
    state.migrationUnknown ||
    state.useCasesUnknown ||
    state.retentionUnknown ||
    state.credentialLifetimeUnknown ||
    state.agilityUnknown ||
    state.infrastructureUnknown ||
    state.vendorUnknown ||
    state.timelineUnknown
  )
}

/** Re-populate smart defaults for any step whose unknown flag is currently true. */
function applyDefaultsToUnknownSteps(
  state: AssessmentState,
  defaults: ReturnType<typeof computeSmartDefaults>,
  updates: Record<string, unknown>
) {
  if (state.cryptoUnknown) {
    updates.currentCrypto = defaults.currentCrypto
    updates.currentCryptoCategories = defaults.currentCryptoCategories
  }
  if (state.sensitivityUnknown) updates.dataSensitivity = defaults.dataSensitivity
  if (state.complianceUnknown) updates.complianceRequirements = defaults.complianceRequirements
  if (state.migrationUnknown) updates.migrationStatus = defaults.migrationStatus
  if (state.useCasesUnknown) updates.cryptoUseCases = defaults.cryptoUseCases
  if (state.retentionUnknown) updates.dataRetention = defaults.dataRetention
  if (state.credentialLifetimeUnknown) updates.credentialLifetime = defaults.credentialLifetime
  if (state.agilityUnknown) updates.cryptoAgility = defaults.cryptoAgility
  if (state.infrastructureUnknown) {
    updates.infrastructure = defaults.infrastructure
    updates.infrastructureSubCategories = {}
  }
  if (state.vendorUnknown) updates.vendorDependency = defaults.vendorDependency
  if (state.timelineUnknown) updates.timelinePressure = defaults.timelinePressure
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setStep: (step) => set({ currentStep: step, lastWizardUpdate: new Date().toISOString() }),

      setAssessmentMode: (mode) => {
        set({
          assessmentMode: mode,
          assessmentStatus: 'in-progress' as const,
          lastWizardUpdate: new Date().toISOString(),
        })
        try {
          useHistoryStore.getState().addEvent({
            type: 'assessment_started',
            timestamp: Date.now(),
            title: `Started ${mode} risk assessment`,
            route: '/assess',
          })
        } catch {
          /* store not ready */
        }
      },

      setIndustry: (industry) => {
        const state = get()
        const persona = usePersonaStore.getState().selectedPersona
        const updates: Record<string, unknown> = {
          industry,
          complianceRequirements: [],
          complianceUnknown: false,
          lastWizardUpdate: new Date().toISOString(),
        }
        // Re-compute smart defaults for any currently-unknown steps
        if (hasAnyUnknown(state)) {
          const defaults = computeSmartDefaults(industry, state.country, persona)
          applyDefaultsToUnknownSteps(state, defaults, updates)
        }
        set(updates)
      },

      setCountry: (country) => {
        const state = get()
        const persona = usePersonaStore.getState().selectedPersona
        const updates: Record<string, unknown> = {
          country,
          complianceRequirements: [],
          complianceUnknown: false,
          lastWizardUpdate: new Date().toISOString(),
        }
        // Re-compute smart defaults for any currently-unknown steps
        if (hasAnyUnknown(state)) {
          const defaults = computeSmartDefaults(state.industry, country, persona)
          applyDefaultsToUnknownSteps(state, defaults, updates)
        }
        set(updates)
      },

      toggleCrypto: (algo) =>
        set((state) => ({
          cryptoUnknown: false,
          currentCrypto: state.currentCrypto.includes(algo)
            ? state.currentCrypto.filter((a) => a !== algo)
            : [...state.currentCrypto, algo],
          lastWizardUpdate: new Date().toISOString(),
        })),

      toggleCryptoCategory: (cat) =>
        set((state) => ({
          cryptoUnknown: false,
          currentCryptoCategories: state.currentCryptoCategories.includes(cat)
            ? state.currentCryptoCategories.filter((c) => c !== cat)
            : [...state.currentCryptoCategories, cat],
          lastWizardUpdate: new Date().toISOString(),
        })),

      setCryptoUnknown: (val) => {
        if (val) {
          const { industry, country } = get()
          const persona = usePersonaStore.getState().selectedPersona
          const defaults = computeSmartDefaults(industry, country, persona)
          set({
            cryptoUnknown: true,
            currentCrypto: defaults.currentCrypto,
            currentCryptoCategories: defaults.currentCryptoCategories,
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({
            cryptoUnknown: false,
            currentCrypto: [],
            currentCryptoCategories: [],
            lastWizardUpdate: new Date().toISOString(),
          })
        }
      },

      toggleDataSensitivity: (level) =>
        set((state) => ({
          sensitivityUnknown: false,
          dataSensitivity: state.dataSensitivity.includes(level)
            ? state.dataSensitivity.filter((l) => l !== level)
            : [...state.dataSensitivity, level],
          lastWizardUpdate: new Date().toISOString(),
        })),

      setSensitivityUnknown: (val) => {
        if (val) {
          const { industry, country } = get()
          const persona = usePersonaStore.getState().selectedPersona
          const defaults = computeSmartDefaults(industry, country, persona)
          set({
            sensitivityUnknown: true,
            dataSensitivity: defaults.dataSensitivity,
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({
            sensitivityUnknown: false,
            dataSensitivity: [],
            lastWizardUpdate: new Date().toISOString(),
          })
        }
      },

      toggleCompliance: (framework) =>
        set((state) => ({
          complianceUnknown: false,
          complianceRequirements: state.complianceRequirements.includes(framework)
            ? state.complianceRequirements.filter((f) => f !== framework)
            : [...state.complianceRequirements, framework],
          lastWizardUpdate: new Date().toISOString(),
        })),

      setComplianceRequirements: (requirements) =>
        set({
          complianceRequirements: requirements,
          complianceUnknown: false,
          lastWizardUpdate: new Date().toISOString(),
        }),

      setComplianceUnknown: (val) => {
        if (val) {
          const { industry, country } = get()
          const persona = usePersonaStore.getState().selectedPersona
          const defaults = computeSmartDefaults(industry, country, persona)
          set({
            complianceUnknown: true,
            complianceRequirements: defaults.complianceRequirements,
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({
            complianceUnknown: false,
            complianceRequirements: [],
            lastWizardUpdate: new Date().toISOString(),
          })
        }
      },

      setMigrationStatus: (status) =>
        set({
          migrationStatus: status,
          migrationUnknown: false,
          lastWizardUpdate: new Date().toISOString(),
        }),

      setMigrationUnknown: (val) => {
        if (val) {
          const { industry, country } = get()
          const persona = usePersonaStore.getState().selectedPersona
          const defaults = computeSmartDefaults(industry, country, persona)
          set({
            migrationUnknown: true,
            migrationStatus: defaults.migrationStatus,
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({
            migrationUnknown: false,
            migrationStatus: '',
            lastWizardUpdate: new Date().toISOString(),
          })
        }
      },

      toggleCryptoUseCase: (useCase) =>
        set((state) => ({
          useCasesUnknown: false,
          cryptoUseCases: state.cryptoUseCases.includes(useCase)
            ? state.cryptoUseCases.filter((u) => u !== useCase)
            : [...state.cryptoUseCases, useCase],
          lastWizardUpdate: new Date().toISOString(),
        })),

      setUseCasesUnknown: (val) => {
        if (val) {
          const { industry, country } = get()
          const persona = usePersonaStore.getState().selectedPersona
          const defaults = computeSmartDefaults(industry, country, persona)
          set({
            useCasesUnknown: true,
            cryptoUseCases: defaults.cryptoUseCases,
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({
            useCasesUnknown: false,
            cryptoUseCases: [],
            lastWizardUpdate: new Date().toISOString(),
          })
        }
      },

      toggleDataRetention: (value) =>
        set((state) => ({
          retentionUnknown: false,
          dataRetention: state.dataRetention.includes(value)
            ? state.dataRetention.filter((r) => r !== value)
            : [...state.dataRetention, value],
          lastWizardUpdate: new Date().toISOString(),
        })),

      setRetentionUnknown: (val) => {
        if (val) {
          const { industry, country } = get()
          const persona = usePersonaStore.getState().selectedPersona
          const defaults = computeSmartDefaults(industry, country, persona)
          set({
            retentionUnknown: true,
            dataRetention: defaults.dataRetention,
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({
            retentionUnknown: false,
            dataRetention: [],
            lastWizardUpdate: new Date().toISOString(),
          })
        }
      },

      toggleCredentialLifetime: (value) =>
        set((state) => ({
          credentialLifetimeUnknown: false,
          credentialLifetime: state.credentialLifetime.includes(value)
            ? state.credentialLifetime.filter((v) => v !== value)
            : [...state.credentialLifetime, value],
          lastWizardUpdate: new Date().toISOString(),
        })),

      setCredentialLifetimeUnknown: (val) => {
        if (val) {
          const { industry, country } = get()
          const persona = usePersonaStore.getState().selectedPersona
          const defaults = computeSmartDefaults(industry, country, persona)
          set({
            credentialLifetimeUnknown: true,
            credentialLifetime: defaults.credentialLifetime,
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({
            credentialLifetimeUnknown: false,
            credentialLifetime: [],
            lastWizardUpdate: new Date().toISOString(),
          })
        }
      },

      setSystemCount: (count) =>
        set({ systemCount: count, lastWizardUpdate: new Date().toISOString() }),

      setTeamSize: (size) => set({ teamSize: size, lastWizardUpdate: new Date().toISOString() }),

      setCryptoAgility: (agility) =>
        set({
          cryptoAgility: agility,
          agilityUnknown: false,
          lastWizardUpdate: new Date().toISOString(),
        }),

      setAgilityUnknown: (val) => {
        if (val) {
          const { industry, country } = get()
          const persona = usePersonaStore.getState().selectedPersona
          const defaults = computeSmartDefaults(industry, country, persona)
          set({
            agilityUnknown: true,
            cryptoAgility: defaults.cryptoAgility,
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({
            agilityUnknown: false,
            cryptoAgility: '',
            lastWizardUpdate: new Date().toISOString(),
          })
        }
      },

      toggleInfrastructure: (item) =>
        set((state) => {
          const alreadySelected = state.infrastructure.includes(item)
          const newInfra = alreadySelected
            ? state.infrastructure.filter((i) => i !== item)
            : [...state.infrastructure, item]
          const newSubCats = { ...state.infrastructureSubCategories }
          if (alreadySelected) delete newSubCats[item]
          return {
            infrastructureUnknown: false,
            infrastructure: newInfra,
            infrastructureSubCategories: newSubCats,
            lastWizardUpdate: new Date().toISOString(),
          }
        }),

      setInfrastructureUnknown: (val) => {
        if (val) {
          const { industry, country } = get()
          const persona = usePersonaStore.getState().selectedPersona
          const defaults = computeSmartDefaults(industry, country, persona)
          set({
            infrastructureUnknown: true,
            infrastructure: defaults.infrastructure,
            infrastructureSubCategories: {},
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({
            infrastructureUnknown: false,
            infrastructure: [],
            infrastructureSubCategories: {},
            lastWizardUpdate: new Date().toISOString(),
          })
        }
      },

      setInfrastructureSubCategory: (layer, cats) =>
        set((state) => ({
          infrastructureSubCategories: { ...state.infrastructureSubCategories, [layer]: cats },
          lastWizardUpdate: new Date().toISOString(),
        })),

      setVendorDependency: (dep) =>
        set({
          vendorDependency: dep,
          vendorUnknown: false,
          lastWizardUpdate: new Date().toISOString(),
        }),

      setVendorUnknown: (val) => {
        if (val) {
          const { industry, country } = get()
          const persona = usePersonaStore.getState().selectedPersona
          const defaults = computeSmartDefaults(industry, country, persona)
          set({
            vendorUnknown: true,
            vendorDependency: defaults.vendorDependency,
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({
            vendorUnknown: false,
            vendorDependency: '',
            lastWizardUpdate: new Date().toISOString(),
          })
        }
      },

      setTimelinePressure: (pressure) =>
        set({
          timelinePressure: pressure,
          timelineUnknown: false,
          lastWizardUpdate: new Date().toISOString(),
        }),

      setTimelineUnknown: (val) => {
        if (val) {
          const { industry, country } = get()
          const persona = usePersonaStore.getState().selectedPersona
          const defaults = computeSmartDefaults(industry, country, persona)
          set({
            timelineUnknown: true,
            timelinePressure: defaults.timelinePressure,
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({
            timelineUnknown: false,
            timelinePressure: '',
            lastWizardUpdate: new Date().toISOString(),
          })
        }
      },

      setImportComplianceSelection: (val) =>
        set({ importComplianceSelection: val, lastWizardUpdate: new Date().toISOString() }),

      setImportProductSelection: (val) =>
        set({ importProductSelection: val, lastWizardUpdate: new Date().toISOString() }),

      hideThreat: (threatId) =>
        set((state) => ({
          hiddenThreats: state.hiddenThreats.includes(threatId)
            ? state.hiddenThreats
            : [...state.hiddenThreats, threatId],
        })),

      restoreThreat: (threatId) =>
        set((state) => ({
          hiddenThreats: state.hiddenThreats.filter((id) => id !== threatId),
        })),

      restoreAllThreats: () => set({ hiddenThreats: [] }),

      markComplete: () => {
        const now = new Date().toISOString()
        set((state) => ({
          assessmentStatus: 'complete' as const,
          completedAt: state.completedAt ?? now,
          lastModifiedAt: now,
          previousRiskScore: state.lastResult?.riskScore ?? state.previousRiskScore,
        }))
        try {
          const result = get().lastResult
          useHistoryStore.getState().addEvent({
            type: 'assessment_completed',
            timestamp: Date.now(),
            title: 'Completed risk assessment',
            detail: result ? `Risk score: ${result.riskScore}` : undefined,
            route: '/assess',
          })
        } catch {
          /* store not ready */
        }
      },

      setResult: (result) => set({ lastResult: result }),

      pushSnapshot: (snapshot) =>
        set((state) => {
          const existing = Array.isArray(state.assessmentHistory) ? state.assessmentHistory : []
          if (existing.some((s) => s.completedAt === snapshot.completedAt)) return {}
          return { assessmentHistory: [...existing, snapshot].slice(-5) }
        }),

      editFromStep: (step) => set({ assessmentStatus: 'in-progress' as const, currentStep: step }),

      reset: () =>
        set((state) => ({
          ...INITIAL_STATE,
          assessmentHistory: state.assessmentHistory,
          previousRiskScore: state.lastResult?.riskScore ?? state.previousRiskScore,
        })),

      getInput: () => {
        const state = get()
        if (
          !state.industry ||
          (state.dataSensitivity.length === 0 && !state.sensitivityUnknown) ||
          !state.migrationStatus
        )
          return null
        const input: AssessmentInput = {
          industry: state.industry,
          currentCrypto: state.currentCrypto,
          dataSensitivity: state.dataSensitivity,
          complianceRequirements: state.complianceRequirements,
          migrationStatus: state.migrationStatus as AssessmentInput['migrationStatus'],
        }
        if (state.cryptoUnknown) input.currentCryptoUnknown = true
        if (state.sensitivityUnknown) input.sensitivityUnknown = true
        if (state.country) input.country = state.country
        if (state.complianceUnknown) input.complianceUnknown = true
        if (state.cryptoUseCases.length > 0) input.cryptoUseCases = state.cryptoUseCases
        if (state.useCasesUnknown) input.useCasesUnknown = true
        if (state.dataRetention.length > 0) input.dataRetention = state.dataRetention
        if (state.retentionUnknown) input.retentionUnknown = true
        if (state.credentialLifetime.length > 0) input.credentialLifetime = state.credentialLifetime
        if (state.credentialLifetimeUnknown) input.credentialLifetimeUnknown = true
        if (state.systemCount)
          input.systemCount = state.systemCount as NonNullable<AssessmentInput['systemCount']>
        if (state.teamSize)
          input.teamSize = state.teamSize as NonNullable<AssessmentInput['teamSize']>
        if (state.cryptoAgility)
          input.cryptoAgility = state.cryptoAgility as NonNullable<AssessmentInput['cryptoAgility']>
        if (state.infrastructure.length > 0) input.infrastructure = state.infrastructure
        if (state.infrastructureUnknown) input.infrastructureUnknown = true
        if (Object.keys(state.infrastructureSubCategories).length > 0)
          input.infrastructureSubCategories = state.infrastructureSubCategories
        if (state.vendorDependency)
          input.vendorDependency = state.vendorDependency as NonNullable<
            AssessmentInput['vendorDependency']
          >
        if (state.vendorUnknown) input.vendorUnknown = true
        if (state.migrationUnknown) input.migrationUnknown = true
        if (state.timelinePressure)
          input.timelinePressure = state.timelinePressure as NonNullable<
            AssessmentInput['timelinePressure']
          >
        if (state.timelineUnknown) input.timelineUnknown = true
        if (state.agilityUnknown) input.agilityUnknown = true
        const persona = usePersonaStore.getState().selectedPersona
        if (persona) input.persona = persona
        return input
      },
    }),
    {
      name: 'pqc-assessment',
      storage: createJSONStorage(() => localStorage),
      version: 10,
      migrate: (persistedState: unknown, version: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = (persistedState ?? {}) as any

        // v0/v1 → v2: Convert dataSensitivity/dataRetention from string to string[]
        if (version <= 1) {
          if (typeof state.dataSensitivity === 'string') {
            state.dataSensitivity = state.dataSensitivity ? [state.dataSensitivity] : []
          }
          if (typeof state.dataRetention === 'string') {
            state.dataRetention = state.dataRetention ? [state.dataRetention] : []
          }
        }

        // v2 → v3: Replace isComplete boolean with assessmentStatus enum, add tracking fields
        if (version <= 2) {
          if (state.isComplete === true) {
            state.assessmentStatus = 'complete'
          } else if (state.industry || state.currentStep > 0) {
            state.assessmentStatus = 'in-progress'
          } else {
            state.assessmentStatus = 'not-started'
          }
          delete state.isComplete
        }

        // Ensure all expected fields exist with safe defaults
        state.currentStep = state.currentStep ?? 0
        state.assessmentMode = state.assessmentMode ?? null
        state.industry = state.industry ?? ''
        state.country = state.country ?? ''
        state.currentCrypto = Array.isArray(state.currentCrypto) ? state.currentCrypto : []
        state.currentCryptoCategories = Array.isArray(state.currentCryptoCategories)
          ? state.currentCryptoCategories
          : []
        state.cryptoUnknown = state.cryptoUnknown ?? false
        state.dataSensitivity = Array.isArray(state.dataSensitivity) ? state.dataSensitivity : []
        state.sensitivityUnknown = state.sensitivityUnknown ?? false
        state.complianceRequirements = Array.isArray(state.complianceRequirements)
          ? state.complianceRequirements
          : []
        state.complianceUnknown = state.complianceUnknown ?? false
        state.migrationStatus = state.migrationStatus ?? ''
        state.cryptoUseCases = Array.isArray(state.cryptoUseCases) ? state.cryptoUseCases : []
        state.useCasesUnknown = state.useCasesUnknown ?? false
        state.dataRetention = Array.isArray(state.dataRetention) ? state.dataRetention : []
        state.retentionUnknown = state.retentionUnknown ?? false
        state.credentialLifetime = Array.isArray(state.credentialLifetime)
          ? state.credentialLifetime
          : []
        state.credentialLifetimeUnknown = state.credentialLifetimeUnknown ?? false
        state.systemCount = state.systemCount ?? ''
        state.teamSize = state.teamSize ?? ''
        state.cryptoAgility = state.cryptoAgility ?? ''
        state.infrastructure = Array.isArray(state.infrastructure) ? state.infrastructure : []
        state.infrastructureUnknown = state.infrastructureUnknown ?? false
        // v4 → v5: clear old free-text infra strings; add infrastructureSubCategories
        if (version <= 4) {
          const validLayerIds = [
            'Cloud',
            'Network',
            'Application',
            'Database',
            'Security Stack',
            'OS',
            'Hardware',
          ]
          state.infrastructure = state.infrastructure.filter((id: string) =>
            validLayerIds.includes(id)
          )
        }

        // v5 → v6: rename 'ECDH' to 'ECDH P-256' in currentCrypto
        if (version <= 5 && Array.isArray(state.currentCrypto)) {
          state.currentCrypto = state.currentCrypto.map((a: string) =>
            a === 'ECDH' ? 'ECDH P-256' : a
          )
        }

        // v6 → v7: derive currentCryptoCategories from existing currentCrypto selections
        if (version <= 6) {
          const familyMap: Record<string, string> = {
            'RSA-2048': 'Key Exchange',
            'RSA-3072': 'Key Exchange',
            'RSA-4096': 'Key Exchange',
            'ECDH P-256': 'Key Exchange',
            'ECDH P-384': 'Key Exchange',
            'ECDH P-521': 'Key Exchange',
            X25519: 'Key Exchange',
            X448: 'Key Exchange',
            'DH (Diffie-Hellman)': 'Key Exchange',
            'ECDSA P-256': 'Signatures',
            'ECDSA P-384': 'Signatures',
            'ECDSA P-521': 'Signatures',
            Ed25519: 'Signatures',
            Ed448: 'Signatures',
            secp256k1: 'Signatures',
            'AES-128': 'Symmetric Encryption',
            'AES-192': 'Symmetric Encryption',
            'AES-256': 'Symmetric Encryption',
            '3DES': 'Symmetric Encryption',
            'ChaCha20-Poly1305': 'Symmetric Encryption',
            'SHA-256': 'Hash & MAC',
            'SHA-3': 'Hash & MAC',
            'HMAC-SHA256': 'Hash & MAC',
          }
          state.currentCryptoCategories = Array.isArray(state.currentCrypto)
            ? [
                ...new Set(
                  (state.currentCrypto as string[]).map((a) => familyMap[a]).filter(Boolean)
                ),
              ]
            : []
        }
        state.infrastructureSubCategories =
          typeof state.infrastructureSubCategories === 'object' &&
          !Array.isArray(state.infrastructureSubCategories) &&
          state.infrastructureSubCategories !== null
            ? state.infrastructureSubCategories
            : {}
        state.vendorDependency = state.vendorDependency ?? ''
        state.vendorUnknown = state.vendorUnknown ?? false
        state.timelinePressure = state.timelinePressure ?? ''
        // v9 → v10: add migrationUnknown, agilityUnknown, timelineUnknown booleans
        // Convert old string 'unknown' values to boolean flags + smart defaults
        if (version <= 9) {
          if (state.migrationStatus === 'unknown') {
            state.migrationUnknown = true
            state.migrationStatus = 'not-started'
          }
          if (state.cryptoAgility === 'unknown') {
            state.agilityUnknown = true
            state.cryptoAgility = 'partially-abstracted'
          }
          if (state.timelinePressure === 'unknown') {
            state.timelineUnknown = true
            state.timelinePressure = 'no-deadline'
          }
        }
        state.migrationUnknown = state.migrationUnknown ?? false
        state.agilityUnknown = state.agilityUnknown ?? false
        state.timelineUnknown = state.timelineUnknown ?? false
        // v8 → v9: add import toggles (default ON)
        state.importComplianceSelection = state.importComplianceSelection ?? true
        state.importProductSelection = state.importProductSelection ?? true
        state.hiddenThreats = Array.isArray(state.hiddenThreats) ? state.hiddenThreats : []
        state.assessmentStatus = state.assessmentStatus ?? 'not-started'
        state.lastResult = state.lastResult ?? null
        state.lastWizardUpdate = state.lastWizardUpdate ?? null
        state.completedAt = state.completedAt ?? null
        state.lastModifiedAt = state.lastModifiedAt ?? null
        state.previousRiskScore = state.previousRiskScore ?? null
        state.assessmentHistory = Array.isArray(state.assessmentHistory)
          ? state.assessmentHistory
          : []

        return state
      },
      partialize: (state) => ({
        lastResult: state.lastResult,
        currentStep: state.currentStep,
        assessmentMode: state.assessmentMode,
        industry: state.industry,
        country: state.country,
        currentCrypto: state.currentCrypto,
        currentCryptoCategories: state.currentCryptoCategories,
        cryptoUnknown: state.cryptoUnknown,
        dataSensitivity: state.dataSensitivity,
        sensitivityUnknown: state.sensitivityUnknown,
        complianceRequirements: state.complianceRequirements,
        complianceUnknown: state.complianceUnknown,
        migrationStatus: state.migrationStatus,
        migrationUnknown: state.migrationUnknown,
        cryptoUseCases: state.cryptoUseCases,
        useCasesUnknown: state.useCasesUnknown,
        dataRetention: state.dataRetention,
        retentionUnknown: state.retentionUnknown,
        credentialLifetime: state.credentialLifetime,
        credentialLifetimeUnknown: state.credentialLifetimeUnknown,
        systemCount: state.systemCount,
        teamSize: state.teamSize,
        cryptoAgility: state.cryptoAgility,
        agilityUnknown: state.agilityUnknown,
        infrastructure: state.infrastructure,
        infrastructureUnknown: state.infrastructureUnknown,
        infrastructureSubCategories: state.infrastructureSubCategories,
        vendorDependency: state.vendorDependency,
        vendorUnknown: state.vendorUnknown,
        timelinePressure: state.timelinePressure,
        timelineUnknown: state.timelineUnknown,
        importComplianceSelection: state.importComplianceSelection,
        importProductSelection: state.importProductSelection,
        hiddenThreats: state.hiddenThreats,
        assessmentStatus: state.assessmentStatus,
        lastWizardUpdate: state.lastWizardUpdate,
        completedAt: state.completedAt,
        lastModifiedAt: state.lastModifiedAt,
        previousRiskScore: state.previousRiskScore,
        assessmentHistory: state.assessmentHistory,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Assessment store rehydration failed:', error)
        }
      },
    }
  )
)
