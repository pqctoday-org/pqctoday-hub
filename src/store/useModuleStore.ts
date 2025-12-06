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
  saveProgress: () => void
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
          // eslint-disable-next-line security/detect-object-injection
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
          // eslint-disable-next-line security/detect-object-injection
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

      saveProgress: () => {
        const progress = get().getFullProgress()
        const dataStr = JSON.stringify(progress, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `pki-learning-progress-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
      },

      loadProgress: (progress) =>
        set((state) => ({
          ...state,
          ...progress,
        })),

      resetProgress: () => set(INITIAL_STATE),

      getFullProgress: () => {
        const {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          saveProgress: _saveProgress,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          loadProgress: _loadProgress,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          resetProgress: _resetProgress,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          getFullProgress: _getFullProgress,
          ...data
        } = get()
        return data
      },
    }),
    {
      name: 'pki-module-storage',
    }
  )
)
