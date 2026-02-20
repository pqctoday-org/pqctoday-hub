import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LearningProgress } from '../services/storage/types'
import { logModuleStart, logStepComplete, logArtifactGenerated } from '../utils/analytics'

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
  resetModuleProgress: (moduleId: string) => void
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

          if (!state.modules[moduleId] || currentModule.status === 'not-started') {
            logModuleStart(moduleId)
          }

          return {
            modules: {
              ...state.modules,
              [moduleId]: {
                ...currentModule,
                ...updates,
                lastVisited: Date.now(),
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
            logStepComplete(moduleId, module.completedSteps.length)
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

      addKey: (key) => {
        logArtifactGenerated('learning', 'key')
        set((state) => ({
          artifacts: {
            ...state.artifacts,
            keys: [...state.artifacts.keys, key],
          },
          timestamp: Date.now(),
        }))
      },

      addCertificate: (cert) => {
        logArtifactGenerated('learning', 'certificate')
        set((state) => ({
          artifacts: {
            ...state.artifacts,
            certificates: [...state.artifacts.certificates, cert],
          },
          timestamp: Date.now(),
        }))
      },

      addCSR: (csr) => {
        logArtifactGenerated('learning', 'csr')
        set((state) => ({
          artifacts: {
            ...state.artifacts,
            csrs: [...state.artifacts.csrs, csr],
          },
          timestamp: Date.now(),
        }))
      },

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

      resetModuleProgress: (moduleId) =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [moduleId]: _removed, ...remainingModules } = state.modules
          return {
            modules: {
              ...remainingModules,
              [moduleId]: {
                status: 'not-started',
                lastVisited: Date.now(),
                timeSpent: 0,
                completedSteps: [],
                quizScores: {},
              },
            },
            timestamp: Date.now(),
          }
        }),

      getFullProgress: () => {
        const {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          saveProgress: _saveProgress,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          loadProgress: _loadProgress,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          resetProgress: _resetProgress,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          resetModuleProgress: _resetModuleProgress,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          getFullProgress: _getFullProgress,
          ...data
        } = get()
        return data
      },
    }),
    {
      name: 'pki-module-storage',
      version: 1,
      // Migration function for handling state version upgrades
      migrate: (persistedState: unknown, version: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persistedState as any

        // Version 0 → Version 1: Ensure all required fields exist
        if (version === 0) {
          return {
            ...state,
            // Ensure artifacts structure exists (added in v1.0.0)
            artifacts: state.artifacts || {
              keys: [],
              certificates: [],
              csrs: [],
            },
            // Ensure preferences exist
            preferences: state.preferences || {
              theme: 'dark',
              defaultKeyType: 'RSA',
              autoSave: true,
            },
            // Ensure notes exist
            notes: state.notes || {},
            // Ensure ejbcaConnections exist
            ejbcaConnections: state.ejbcaConnections || {},
            // Add version field
            version: '1.0.0',
            // Update timestamp
            timestamp: state.timestamp || Date.now(),
          }
        }

        // Future migrations can be added here
        // Example for v2:
        // if (version === 1) {
        //   return { ...state, newField: defaultValue }
        // }

        return state
      },
    }
  )
)

// Add beforeunload/pagehide handlers to ensure progress is saved before navigation
if (typeof window !== 'undefined') {
  const handleBeforeUnload = () => {
    try {
      const state = useModuleStore.getState()
      const progress = state.getFullProgress()
      const persistData = { state: progress, version: 1 }
      localStorage.setItem('pki-module-storage', JSON.stringify(persistData))
    } catch (error) {
      // Handle QuotaExceededError and other storage errors
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Progress may not be saved.')
      } else {
        console.error('Failed to save progress on unload:', error)
      }
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('pagehide', handleBeforeUnload) // iOS Safari support
}
