import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AssessmentInput } from '../hooks/assessmentTypes'
import type { AssessmentResult } from '../hooks/assessmentTypes'
import { usePersonaStore } from './usePersonaStore'

export type AssessmentMode = 'quick' | 'comprehensive'

interface AssessmentState {
  currentStep: number
  assessmentMode: AssessmentMode | null
  industry: string
  country: string
  currentCrypto: string[]
  cryptoUnknown: boolean
  dataSensitivity: string[]
  sensitivityUnknown: boolean
  complianceRequirements: string[]
  complianceUnknown: boolean
  migrationStatus: AssessmentInput['migrationStatus'] | ''
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
  infrastructure: string[]
  infrastructureUnknown: boolean
  vendorDependency: NonNullable<AssessmentInput['vendorDependency']> | ''
  vendorUnknown: boolean
  timelinePressure: NonNullable<AssessmentInput['timelinePressure']> | ''
  // Control state
  isComplete: boolean
  lastResult: AssessmentResult | null
  lastWizardUpdate: string | null
  // Actions
  setStep: (step: number) => void
  setAssessmentMode: (mode: AssessmentMode) => void
  setIndustry: (industry: string) => void
  setCountry: (country: string) => void
  toggleCrypto: (algo: string) => void
  setCryptoUnknown: (val: boolean) => void
  toggleDataSensitivity: (level: string) => void
  setSensitivityUnknown: (val: boolean) => void
  toggleCompliance: (framework: string) => void
  setComplianceUnknown: (val: boolean) => void
  setMigrationStatus: (status: AssessmentInput['migrationStatus']) => void
  toggleCryptoUseCase: (useCase: string) => void
  setUseCasesUnknown: (val: boolean) => void
  toggleDataRetention: (value: string) => void
  setRetentionUnknown: (val: boolean) => void
  toggleCredentialLifetime: (value: string) => void
  setCredentialLifetimeUnknown: (val: boolean) => void
  setSystemCount: (count: NonNullable<AssessmentInput['systemCount']>) => void
  setTeamSize: (size: NonNullable<AssessmentInput['teamSize']>) => void
  setCryptoAgility: (agility: NonNullable<AssessmentInput['cryptoAgility']>) => void
  toggleInfrastructure: (item: string) => void
  setInfrastructureUnknown: (val: boolean) => void
  setVendorDependency: (dep: NonNullable<AssessmentInput['vendorDependency']>) => void
  setVendorUnknown: (val: boolean) => void
  setTimelinePressure: (pressure: NonNullable<AssessmentInput['timelinePressure']>) => void
  markComplete: () => void
  setResult: (result: AssessmentResult) => void
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
  cryptoUnknown: false,
  dataSensitivity: [] as string[],
  sensitivityUnknown: false,
  complianceRequirements: [] as string[],
  complianceUnknown: false,
  migrationStatus: '' as AssessmentInput['migrationStatus'] | '',
  cryptoUseCases: [] as string[],
  useCasesUnknown: false,
  dataRetention: [] as string[],
  retentionUnknown: false,
  credentialLifetime: [] as string[],
  credentialLifetimeUnknown: false,
  systemCount: '' as NonNullable<AssessmentInput['systemCount']> | '',
  teamSize: '' as NonNullable<AssessmentInput['teamSize']> | '',
  cryptoAgility: '' as NonNullable<AssessmentInput['cryptoAgility']> | '',
  infrastructure: [] as string[],
  infrastructureUnknown: false,
  vendorDependency: '' as NonNullable<AssessmentInput['vendorDependency']> | '',
  vendorUnknown: false,
  timelinePressure: '' as NonNullable<AssessmentInput['timelinePressure']> | '',
  isComplete: false,
  lastResult: null as AssessmentResult | null,
  lastWizardUpdate: null as string | null,
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setStep: (step) => set({ currentStep: step, lastWizardUpdate: new Date().toISOString() }),

      setAssessmentMode: (mode) =>
        set({ assessmentMode: mode, lastWizardUpdate: new Date().toISOString() }),

      setIndustry: (industry) =>
        set({
          industry,
          complianceRequirements: [],
          complianceUnknown: false,
          lastWizardUpdate: new Date().toISOString(),
        }),

      setCountry: (country) =>
        set({
          country,
          complianceRequirements: [],
          complianceUnknown: false,
          lastWizardUpdate: new Date().toISOString(),
        }),

      toggleCrypto: (algo) =>
        set((state) => ({
          cryptoUnknown: false,
          currentCrypto: state.currentCrypto.includes(algo)
            ? state.currentCrypto.filter((a) => a !== algo)
            : [...state.currentCrypto, algo],
          lastWizardUpdate: new Date().toISOString(),
        })),

      setCryptoUnknown: (val) => {
        if (val) {
          set({
            cryptoUnknown: true,
            currentCrypto: [],
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({ cryptoUnknown: false, lastWizardUpdate: new Date().toISOString() })
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
          set({
            sensitivityUnknown: true,
            dataSensitivity: [],
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({ sensitivityUnknown: false, lastWizardUpdate: new Date().toISOString() })
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

      setComplianceUnknown: (val) => {
        if (val) {
          set({
            complianceUnknown: true,
            complianceRequirements: [],
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({ complianceUnknown: false, lastWizardUpdate: new Date().toISOString() })
        }
      },

      setMigrationStatus: (status) =>
        set({ migrationStatus: status, lastWizardUpdate: new Date().toISOString() }),

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
          set({
            useCasesUnknown: true,
            cryptoUseCases: [],
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({ useCasesUnknown: false, lastWizardUpdate: new Date().toISOString() })
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
          set({
            retentionUnknown: true,
            dataRetention: [],
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({ retentionUnknown: false, lastWizardUpdate: new Date().toISOString() })
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
          set({
            credentialLifetimeUnknown: true,
            credentialLifetime: [],
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({ credentialLifetimeUnknown: false, lastWizardUpdate: new Date().toISOString() })
        }
      },

      setSystemCount: (count) =>
        set({ systemCount: count, lastWizardUpdate: new Date().toISOString() }),

      setTeamSize: (size) => set({ teamSize: size, lastWizardUpdate: new Date().toISOString() }),

      setCryptoAgility: (agility) =>
        set({ cryptoAgility: agility, lastWizardUpdate: new Date().toISOString() }),

      toggleInfrastructure: (item) =>
        set((state) => ({
          infrastructureUnknown: false,
          infrastructure: state.infrastructure.includes(item)
            ? state.infrastructure.filter((i) => i !== item)
            : [...state.infrastructure, item],
          lastWizardUpdate: new Date().toISOString(),
        })),

      setInfrastructureUnknown: (val) => {
        if (val) {
          set({
            infrastructureUnknown: true,
            infrastructure: [],
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({ infrastructureUnknown: false, lastWizardUpdate: new Date().toISOString() })
        }
      },

      setVendorDependency: (dep) =>
        set({
          vendorDependency: dep,
          vendorUnknown: false,
          lastWizardUpdate: new Date().toISOString(),
        }),

      setVendorUnknown: (val) => {
        if (val) {
          set({
            vendorUnknown: true,
            vendorDependency: '',
            lastWizardUpdate: new Date().toISOString(),
          })
        } else {
          set({ vendorUnknown: false, lastWizardUpdate: new Date().toISOString() })
        }
      },

      setTimelinePressure: (pressure) =>
        set({ timelinePressure: pressure, lastWizardUpdate: new Date().toISOString() }),

      markComplete: () => set({ isComplete: true }),

      setResult: (result) => set({ lastResult: result }),

      editFromStep: (step) => set({ isComplete: false, currentStep: step, lastResult: null }),

      reset: () => set(INITIAL_STATE),

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
        if (state.vendorDependency)
          input.vendorDependency = state.vendorDependency as NonNullable<
            AssessmentInput['vendorDependency']
          >
        if (state.vendorUnknown) input.vendorUnknown = true
        if (state.timelinePressure)
          input.timelinePressure = state.timelinePressure as NonNullable<
            AssessmentInput['timelinePressure']
          >
        const persona = usePersonaStore.getState().selectedPersona
        if (persona) input.persona = persona
        return input
      },
    }),
    {
      name: 'pqc-assessment',
      storage: createJSONStorage(() => localStorage),
      version: 2,
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

        // Ensure all expected fields exist with safe defaults
        state.currentStep = state.currentStep ?? 0
        state.assessmentMode = state.assessmentMode ?? null
        state.industry = state.industry ?? ''
        state.country = state.country ?? ''
        state.currentCrypto = Array.isArray(state.currentCrypto) ? state.currentCrypto : []
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
        state.vendorDependency = state.vendorDependency ?? ''
        state.vendorUnknown = state.vendorUnknown ?? false
        state.timelinePressure = state.timelinePressure ?? ''
        state.isComplete = state.isComplete ?? false
        state.lastResult = state.lastResult ?? null
        state.lastWizardUpdate = state.lastWizardUpdate ?? null

        return state
      },
      partialize: (state) => ({
        lastResult: state.lastResult,
        currentStep: state.currentStep,
        assessmentMode: state.assessmentMode,
        industry: state.industry,
        country: state.country,
        currentCrypto: state.currentCrypto,
        cryptoUnknown: state.cryptoUnknown,
        dataSensitivity: state.dataSensitivity,
        sensitivityUnknown: state.sensitivityUnknown,
        complianceRequirements: state.complianceRequirements,
        complianceUnknown: state.complianceUnknown,
        migrationStatus: state.migrationStatus,
        cryptoUseCases: state.cryptoUseCases,
        useCasesUnknown: state.useCasesUnknown,
        dataRetention: state.dataRetention,
        retentionUnknown: state.retentionUnknown,
        credentialLifetime: state.credentialLifetime,
        credentialLifetimeUnknown: state.credentialLifetimeUnknown,
        systemCount: state.systemCount,
        teamSize: state.teamSize,
        cryptoAgility: state.cryptoAgility,
        infrastructure: state.infrastructure,
        infrastructureUnknown: state.infrastructureUnknown,
        vendorDependency: state.vendorDependency,
        vendorUnknown: state.vendorUnknown,
        timelinePressure: state.timelinePressure,
        isComplete: state.isComplete,
        lastWizardUpdate: state.lastWizardUpdate,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Assessment store rehydration failed:', error)
        }
      },
    }
  )
)
