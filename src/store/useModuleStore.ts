import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LearningProgress } from '../services/storage/types'

interface ModuleState extends LearningProgress {
  // Actions
  updateModuleProgress: (
    moduleId: string,
    updates: Partial<LearningProgress['modules'][string]>
  ) => void
  markStepComplete: (moduleId: string, stepId: string) => void
  loadProgress: (progress: LearningProgress) => void
  resetProgress: () => void
  getFullProgress: () => LearningProgress
  addKey: (key: LearningProgress['artifacts']['keys'][0]) => void
  addCertificate: (cert: LearningProgress['artifacts']['certificates'][0]) => void
  addCSR: (csr: LearningProgress['artifacts']['csrs'][0]) => void
}

const INITIAL_STATE: LearningProgress = {
  version: '1.0.0',
  timestamp: Date.now(),
  modules: {
    'module-1': {
      status: 'not-started',
      lastVisited: Date.now(),
      timeSpent: 0,
      completedSteps: [],
      quizScores: {},
    },
  },
  artifacts: {
    keys: [],
    certificates: [],
    csrs: [],
  },
  ejbcaConnections: {},
  preferences: {
    theme: 'dark',
    defaultKeyType: 'RSA',
    autoSave: true,
  },
  notes: {},
}

console.log('Initializing useModuleStore...')

export const useModuleStore = create<ModuleState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      updateModuleProgress: (moduleId, updates) =>
        set((state) => {
          const currentModule = state.modules[moduleId] || {
            status: 'in-progress',
            lastVisited: Date.now(),
            timeSpent: 0,
            completedSteps: [],
            quizScores: {},
          }

          return {
            modules: {
              ...state.modules,
              [moduleId]: {
                ...currentModule,
                ...updates,
              },
            },
            timestamp: Date.now(),
          }
        }),

      markStepComplete: (moduleId, stepId) =>
        set((state) => {
          const module = state.modules[moduleId]
          if (module && !module.completedSteps.includes(stepId)) {
            return {
              modules: {
                ...state.modules,
                [moduleId]: {
                  ...module,
                  completedSteps: [...module.completedSteps, stepId],
                },
              },
              timestamp: Date.now(),
            }
          }
          return state
        }),

      addKey: (key) =>
        set((state) => ({
          artifacts: {
            ...state.artifacts,
            keys: [...state.artifacts.keys, key],
          },
          timestamp: Date.now(),
        })),

      addCertificate: (cert) =>
        set((state) => ({
          artifacts: {
            ...state.artifacts,
            certificates: [...state.artifacts.certificates, cert],
          },
          timestamp: Date.now(),
        })),

      addCSR: (csr) =>
        set((state) => ({
          artifacts: {
            ...state.artifacts,
            csrs: [...state.artifacts.csrs, csr],
          },
          timestamp: Date.now(),
        })),

      loadProgress: (progress) =>
        set((state) => ({
          ...state,
          ...progress,
        })),

      resetProgress: () => set(INITIAL_STATE),

      getFullProgress: () => {
        const { loadProgress, resetProgress, getFullProgress, ...data } = get()
        return data
      },
    }),
    {
      name: 'pki-module-storage',
    }
  )
)
