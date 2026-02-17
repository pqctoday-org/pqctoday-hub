import { create } from 'zustand'
import type { AssessmentInput } from '../hooks/useAssessmentEngine'

interface AssessmentState {
  currentStep: number
  industry: string
  currentCrypto: string[]
  dataSensitivity: AssessmentInput['dataSensitivity'] | ''
  complianceRequirements: string[]
  migrationStatus: AssessmentInput['migrationStatus'] | ''
  isComplete: boolean
  setStep: (step: number) => void
  setIndustry: (industry: string) => void
  toggleCrypto: (algo: string) => void
  setDataSensitivity: (level: AssessmentInput['dataSensitivity']) => void
  toggleCompliance: (framework: string) => void
  setMigrationStatus: (status: AssessmentInput['migrationStatus']) => void
  markComplete: () => void
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
  isComplete: false,
}

export const useAssessmentStore = create<AssessmentState>()((set, get) => ({
  ...INITIAL_STATE,

  setStep: (step) => set({ currentStep: step }),

  setIndustry: (industry) => set({ industry }),

  toggleCrypto: (algo) =>
    set((state) => ({
      currentCrypto: state.currentCrypto.includes(algo)
        ? state.currentCrypto.filter((a) => a !== algo)
        : [...state.currentCrypto, algo],
    })),

  setDataSensitivity: (level) => set({ dataSensitivity: level }),

  toggleCompliance: (framework) =>
    set((state) => ({
      complianceRequirements: state.complianceRequirements.includes(framework)
        ? state.complianceRequirements.filter((f) => f !== framework)
        : [...state.complianceRequirements, framework],
    })),

  setMigrationStatus: (status) => set({ migrationStatus: status }),

  markComplete: () => set({ isComplete: true }),

  reset: () => set(INITIAL_STATE),

  getInput: () => {
    const state = get()
    if (!state.industry || !state.dataSensitivity || !state.migrationStatus) return null
    return {
      industry: state.industry,
      currentCrypto: state.currentCrypto,
      dataSensitivity: state.dataSensitivity as AssessmentInput['dataSensitivity'],
      complianceRequirements: state.complianceRequirements,
      migrationStatus: state.migrationStatus as AssessmentInput['migrationStatus'],
    }
  },
}))
