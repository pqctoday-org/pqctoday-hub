import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AssessmentInput } from '../hooks/useAssessmentEngine'
import type { AssessmentResult } from '../hooks/useAssessmentEngine'

interface AssessmentState {
  currentStep: number
  industry: string
  currentCrypto: string[]
  dataSensitivity: AssessmentInput['dataSensitivity'] | ''
  complianceRequirements: string[]
  migrationStatus: AssessmentInput['migrationStatus'] | ''
  // Extended fields
  cryptoUseCases: string[]
  dataRetention: NonNullable<AssessmentInput['dataRetention']> | ''
  systemCount: NonNullable<AssessmentInput['systemCount']> | ''
  teamSize: NonNullable<AssessmentInput['teamSize']> | ''
  cryptoAgility: NonNullable<AssessmentInput['cryptoAgility']> | ''
  infrastructure: string[]
  vendorDependency: NonNullable<AssessmentInput['vendorDependency']> | ''
  timelinePressure: NonNullable<AssessmentInput['timelinePressure']> | ''
  // Control state
  isComplete: boolean
  lastResult: AssessmentResult | null
  lastWizardUpdate: string | null
  // Actions
  setStep: (step: number) => void
  setIndustry: (industry: string) => void
  toggleCrypto: (algo: string) => void
  setDataSensitivity: (level: AssessmentInput['dataSensitivity']) => void
  toggleCompliance: (framework: string) => void
  setMigrationStatus: (status: AssessmentInput['migrationStatus']) => void
  toggleCryptoUseCase: (useCase: string) => void
  setDataRetention: (retention: NonNullable<AssessmentInput['dataRetention']>) => void
  setSystemCount: (count: NonNullable<AssessmentInput['systemCount']>) => void
  setTeamSize: (size: NonNullable<AssessmentInput['teamSize']>) => void
  setCryptoAgility: (agility: NonNullable<AssessmentInput['cryptoAgility']>) => void
  toggleInfrastructure: (item: string) => void
  setVendorDependency: (dep: NonNullable<AssessmentInput['vendorDependency']>) => void
  setTimelinePressure: (pressure: NonNullable<AssessmentInput['timelinePressure']>) => void
  markComplete: () => void
  setResult: (result: AssessmentResult) => void
  editFromStep: (step: number) => void
  reset: () => void
  getInput: () => AssessmentInput | null
}

const INITIAL_STATE = {
  currentStep: 0,
  industry: '',
  currentCrypto: [] as string[],
  dataSensitivity: '' as AssessmentInput['dataSensitivity'] | '',
  complianceRequirements: [] as string[],
  migrationStatus: '' as AssessmentInput['migrationStatus'] | '',
  cryptoUseCases: [] as string[],
  dataRetention: '' as NonNullable<AssessmentInput['dataRetention']> | '',
  systemCount: '' as NonNullable<AssessmentInput['systemCount']> | '',
  teamSize: '' as NonNullable<AssessmentInput['teamSize']> | '',
  cryptoAgility: '' as NonNullable<AssessmentInput['cryptoAgility']> | '',
  infrastructure: [] as string[],
  vendorDependency: '' as NonNullable<AssessmentInput['vendorDependency']> | '',
  timelinePressure: '' as NonNullable<AssessmentInput['timelinePressure']> | '',
  isComplete: false,
  lastResult: null as AssessmentResult | null,
  lastWizardUpdate: null as string | null,
}

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000 // 24 hours

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setStep: (step) => set({ currentStep: step, lastWizardUpdate: new Date().toISOString() }),

      setIndustry: (industry) => set({ industry, lastWizardUpdate: new Date().toISOString() }),

      toggleCrypto: (algo) =>
        set((state) => ({
          currentCrypto: state.currentCrypto.includes(algo)
            ? state.currentCrypto.filter((a) => a !== algo)
            : [...state.currentCrypto, algo],
          lastWizardUpdate: new Date().toISOString(),
        })),

      setDataSensitivity: (level) =>
        set({ dataSensitivity: level, lastWizardUpdate: new Date().toISOString() }),

      toggleCompliance: (framework) =>
        set((state) => ({
          complianceRequirements: state.complianceRequirements.includes(framework)
            ? state.complianceRequirements.filter((f) => f !== framework)
            : [...state.complianceRequirements, framework],
          lastWizardUpdate: new Date().toISOString(),
        })),

      setMigrationStatus: (status) =>
        set({ migrationStatus: status, lastWizardUpdate: new Date().toISOString() }),

      toggleCryptoUseCase: (useCase) =>
        set((state) => ({
          cryptoUseCases: state.cryptoUseCases.includes(useCase)
            ? state.cryptoUseCases.filter((u) => u !== useCase)
            : [...state.cryptoUseCases, useCase],
          lastWizardUpdate: new Date().toISOString(),
        })),

      setDataRetention: (retention) =>
        set({ dataRetention: retention, lastWizardUpdate: new Date().toISOString() }),

      setSystemCount: (count) =>
        set({ systemCount: count, lastWizardUpdate: new Date().toISOString() }),

      setTeamSize: (size) => set({ teamSize: size, lastWizardUpdate: new Date().toISOString() }),

      setCryptoAgility: (agility) =>
        set({ cryptoAgility: agility, lastWizardUpdate: new Date().toISOString() }),

      toggleInfrastructure: (item) =>
        set((state) => ({
          infrastructure: state.infrastructure.includes(item)
            ? state.infrastructure.filter((i) => i !== item)
            : [...state.infrastructure, item],
          lastWizardUpdate: new Date().toISOString(),
        })),

      setVendorDependency: (dep) =>
        set({ vendorDependency: dep, lastWizardUpdate: new Date().toISOString() }),

      setTimelinePressure: (pressure) =>
        set({ timelinePressure: pressure, lastWizardUpdate: new Date().toISOString() }),

      markComplete: () => set({ isComplete: true }),

      setResult: (result) => set({ lastResult: result }),

      editFromStep: (step) => set({ isComplete: false, currentStep: step, lastResult: null }),

      reset: () => set(INITIAL_STATE),

      getInput: () => {
        const state = get()
        if (!state.industry || !state.dataSensitivity || !state.migrationStatus) return null
        const input: AssessmentInput = {
          industry: state.industry,
          currentCrypto: state.currentCrypto,
          dataSensitivity: state.dataSensitivity as AssessmentInput['dataSensitivity'],
          complianceRequirements: state.complianceRequirements,
          migrationStatus: state.migrationStatus as AssessmentInput['migrationStatus'],
        }
        // Include extended fields only when they have values
        if (state.cryptoUseCases.length > 0) input.cryptoUseCases = state.cryptoUseCases
        if (state.dataRetention)
          input.dataRetention = state.dataRetention as NonNullable<AssessmentInput['dataRetention']>
        if (state.systemCount)
          input.systemCount = state.systemCount as NonNullable<AssessmentInput['systemCount']>
        if (state.teamSize)
          input.teamSize = state.teamSize as NonNullable<AssessmentInput['teamSize']>
        if (state.cryptoAgility)
          input.cryptoAgility = state.cryptoAgility as NonNullable<AssessmentInput['cryptoAgility']>
        if (state.infrastructure.length > 0) input.infrastructure = state.infrastructure
        if (state.vendorDependency)
          input.vendorDependency = state.vendorDependency as NonNullable<
            AssessmentInput['vendorDependency']
          >
        if (state.timelinePressure)
          input.timelinePressure = state.timelinePressure as NonNullable<
            AssessmentInput['timelinePressure']
          >
        return input
      },
    }),
    {
      name: 'pqc-assessment',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lastResult: state.lastResult,
        currentStep: state.currentStep,
        industry: state.industry,
        currentCrypto: state.currentCrypto,
        dataSensitivity: state.dataSensitivity,
        complianceRequirements: state.complianceRequirements,
        migrationStatus: state.migrationStatus,
        cryptoUseCases: state.cryptoUseCases,
        dataRetention: state.dataRetention,
        systemCount: state.systemCount,
        teamSize: state.teamSize,
        cryptoAgility: state.cryptoAgility,
        infrastructure: state.infrastructure,
        vendorDependency: state.vendorDependency,
        timelinePressure: state.timelinePressure,
        isComplete: state.isComplete,
        lastWizardUpdate: state.lastWizardUpdate,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.lastWizardUpdate || state.isComplete) return
        const elapsed = Date.now() - new Date(state.lastWizardUpdate).getTime()
        if (elapsed > STALE_THRESHOLD_MS) {
          state.currentStep = 0
          state.industry = ''
          state.currentCrypto = []
          state.dataSensitivity = ''
          state.complianceRequirements = []
          state.migrationStatus = ''
          state.cryptoUseCases = []
          state.dataRetention = ''
          state.systemCount = ''
          state.teamSize = ''
          state.cryptoAgility = ''
          state.infrastructure = []
          state.vendorDependency = ''
          state.timelinePressure = ''
          state.lastWizardUpdate = null
        }
      },
    }
  )
)
