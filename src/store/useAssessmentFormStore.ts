// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AssessmentInput } from '../hooks/assessmentTypes'
import { usePersonaStore } from './usePersonaStore'
import { useHistoryStore } from './useHistoryStore'
import { computeSmartDefaults } from '../components/Assess/smartDefaults'
import { pullLegacyAssessmentState, runLegacyAssessmentMigrations } from './assessmentMigration'

export type AssessmentMode = 'quick' | 'comprehensive'
export type AssessmentStatus = 'not-started' | 'in-progress' | 'complete'

export interface AssessmentFormState {
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
  cryptoUseCases: string[]
  useCasesUnknown: boolean
  dataRetention: string[]
  retentionUnknown: boolean
  credentialLifetime: string[]
  credentialLifetimeUnknown: boolean
  systemCount: NonNullable<AssessmentInput['systemCount']> | ''
  teamSize: NonNullable<AssessmentInput['teamSize']> | ''
  scaleUnknown: boolean
  cryptoAgility: NonNullable<AssessmentInput['cryptoAgility']> | ''
  agilityUnknown: boolean
  infrastructure: string[]
  infrastructureUnknown: boolean
  infrastructureSubCategories: Record<string, string[]>
  vendorDependency: NonNullable<AssessmentInput['vendorDependency']> | ''
  vendorUnknown: boolean
  timelinePressure: NonNullable<AssessmentInput['timelinePressure']> | ''
  timelineUnknown: boolean
  importComplianceSelection: boolean
  importProductSelection: boolean
  assessmentStatus: AssessmentStatus
  lastWizardUpdate: string | null

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
  setScaleUnknown: (val: boolean) => void
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
  setAssessmentStatus: (status: AssessmentStatus) => void // Internal proxy sync
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
  scaleUnknown: false,
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
  assessmentStatus: 'not-started' as AssessmentStatus,
  lastWizardUpdate: null as string | null,
}

function hasAnyUnknown(state: AssessmentFormState): boolean {
  return (
    state.cryptoUnknown ||
    state.sensitivityUnknown ||
    state.complianceUnknown ||
    state.migrationUnknown ||
    state.useCasesUnknown ||
    state.retentionUnknown ||
    state.credentialLifetimeUnknown ||
    state.scaleUnknown ||
    state.agilityUnknown ||
    state.infrastructureUnknown ||
    state.vendorUnknown ||
    state.timelineUnknown
  )
}

function applyDefaultsToUnknownSteps(
  state: AssessmentFormState,
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
  if (state.scaleUnknown) {
    updates.systemCount = defaults.systemCount
    updates.teamSize = defaults.teamSize
  }
  if (state.agilityUnknown) updates.cryptoAgility = defaults.cryptoAgility
  if (state.infrastructureUnknown) {
    updates.infrastructure = defaults.infrastructure
    updates.infrastructureSubCategories = {}
  }
  if (state.vendorUnknown) updates.vendorDependency = defaults.vendorDependency
  if (state.timelineUnknown) updates.timelinePressure = defaults.timelinePressure
}

export const useAssessmentFormStore = create<AssessmentFormState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setStep: (step) => set({ currentStep: step, lastWizardUpdate: new Date().toISOString() }),

      setAssessmentMode: (mode) => {
        const state = get()
        const updates: Partial<AssessmentFormState> = {
          assessmentMode: mode,
          assessmentStatus: 'in-progress' as const,
          lastWizardUpdate: new Date().toISOString(),
        }
        // When switching comprehensive → quick, clear fields the quick-mode
        // wizard never asks about so they don't silently influence scoring.
        if (state.assessmentMode === 'comprehensive' && mode === 'quick') {
          updates.cryptoUseCases = []
          updates.useCasesUnknown = false
          updates.dataRetention = []
          updates.retentionUnknown = false
          updates.credentialLifetime = []
          updates.credentialLifetimeUnknown = false
          updates.systemCount = ''
          updates.teamSize = ''
          updates.scaleUnknown = false
          updates.cryptoAgility = ''
          updates.agilityUnknown = false
          updates.infrastructure = []
          updates.infrastructureSubCategories = {}
          updates.infrastructureUnknown = false
          updates.vendorDependency = ''
          updates.vendorUnknown = false
          updates.timelinePressure = ''
          updates.timelineUnknown = false
        }
        set(updates)
        try {
          useHistoryStore.getState().addEvent({
            type: 'assessment_started',
            timestamp: Date.now(),
            title: `Started ${mode} risk assessment`,
            route: '/assess',
          })
        } catch {
          /* history push may fail if store not ready */
        }
      },

      setIndustry: (industry) => {
        const state = get()
        const { selectedPersona: persona, experienceLevel } = usePersonaStore.getState()
        const updates: Record<string, unknown> = {
          industry,
          complianceRequirements: [],
          complianceUnknown: false,
          lastWizardUpdate: new Date().toISOString(),
        }
        if (hasAnyUnknown(state)) {
          const defaults = computeSmartDefaults(
            industry,
            state.country,
            persona,
            experienceLevel,
            true
          )
          applyDefaultsToUnknownSteps(state, defaults, updates)
        }
        set(updates)
      },

      setCountry: (country) => {
        const state = get()
        const { selectedPersona: persona, experienceLevel } = usePersonaStore.getState()
        const updates: Record<string, unknown> = {
          country,
          complianceRequirements: [],
          complianceUnknown: false,
          lastWizardUpdate: new Date().toISOString(),
        }
        if (hasAnyUnknown(state)) {
          const defaults = computeSmartDefaults(
            state.industry,
            country,
            persona,
            experienceLevel,
            true
          )
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
          const { selectedPersona: persona, experienceLevel } = usePersonaStore.getState()
          const defaults = computeSmartDefaults(industry, country, persona, experienceLevel, true)
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
          const { selectedPersona: persona, experienceLevel } = usePersonaStore.getState()
          const defaults = computeSmartDefaults(industry, country, persona, experienceLevel)
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
          const { selectedPersona: persona, experienceLevel } = usePersonaStore.getState()
          const defaults = computeSmartDefaults(industry, country, persona, experienceLevel)
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
          const { selectedPersona: persona, experienceLevel } = usePersonaStore.getState()
          const defaults = computeSmartDefaults(industry, country, persona, experienceLevel)
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
          const { selectedPersona: persona, experienceLevel } = usePersonaStore.getState()
          const defaults = computeSmartDefaults(industry, country, persona, experienceLevel, true)
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
          const { selectedPersona: persona, experienceLevel } = usePersonaStore.getState()
          const defaults = computeSmartDefaults(industry, country, persona, experienceLevel)
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
          const { selectedPersona: persona, experienceLevel } = usePersonaStore.getState()
          const defaults = computeSmartDefaults(industry, country, persona, experienceLevel)
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
        set({
          systemCount: count,
          scaleUnknown: false,
          lastWizardUpdate: new Date().toISOString(),
        }),

      setTeamSize: (size) =>
        set({ teamSize: size, scaleUnknown: false, lastWizardUpdate: new Date().toISOString() }),

      setScaleUnknown: (val) => {
        if (val) {
          const { industry, country } = get()
          const { selectedPersona: persona, experienceLevel } = usePersonaStore.getState()
          const defaults = computeSmartDefaults(industry, country, persona, experienceLevel)
          set({
            scaleUnknown: true,
            systemCount: defaults.systemCount,
            teamSize: defaults.teamSize,
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({
            scaleUnknown: false,
            systemCount: '',
            teamSize: '',
            lastWizardUpdate: new Date().toISOString(),
          })
        }
      },

      setCryptoAgility: (agility) =>
        set({
          cryptoAgility: agility,
          agilityUnknown: false,
          lastWizardUpdate: new Date().toISOString(),
        }),

      setAgilityUnknown: (val) => {
        if (val) {
          const { industry, country } = get()
          const { selectedPersona: persona, experienceLevel } = usePersonaStore.getState()
          const defaults = computeSmartDefaults(industry, country, persona, experienceLevel)
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
          const { selectedPersona: persona, experienceLevel } = usePersonaStore.getState()
          const defaults = computeSmartDefaults(industry, country, persona, experienceLevel, true)
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
          const { selectedPersona: persona, experienceLevel } = usePersonaStore.getState()
          const defaults = computeSmartDefaults(industry, country, persona, experienceLevel)
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
          const { selectedPersona: persona, experienceLevel } = usePersonaStore.getState()
          const defaults = computeSmartDefaults(industry, country, persona, experienceLevel)
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

      setAssessmentStatus: (status) => set({ assessmentStatus: status }),

      editFromStep: (step) => set({ assessmentStatus: 'in-progress' as const, currentStep: step }),

      reset: () =>
        set({
          ...INITIAL_STATE,
        }),

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
        if (state.scaleUnknown) input.scaleUnknown = true
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
      name: 'pqc-assessment-form',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        let state = (persistedState ?? {}) as Record<string, unknown>

        // V0 Migration: Safely inherit from old pqc-assessment persistence if we have no state
        if (version === 0 && Object.keys(state).length === 0) {
          const legacy = pullLegacyAssessmentState()
          if (legacy) {
            state = runLegacyAssessmentMigrations(legacy.state, legacy.version)
          }
        }

        // V1 Guard: if industry is unset but wizard advanced past step 0,
        // clamp back to step 0 so industry selection is always completed before
        // compliance frameworks are shown (prevents unfiltered GSMA / all-frameworks display).
        if (!state.industry && ((state.currentStep as number) ?? 0) > 0) {
          state = { ...state, currentStep: 0 }
        }

        return state
      },
      partialize: (state) => ({
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
        scaleUnknown: state.scaleUnknown,
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
        assessmentStatus: state.assessmentStatus,
        lastWizardUpdate: state.lastWizardUpdate,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('Assessment form store rehydration failed:', error)
      },
    }
  )
)
