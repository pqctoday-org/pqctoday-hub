/* eslint-disable security/detect-object-injection */
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
  trackDailyVisit: () => void
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
  sessionTracking: undefined,
}

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
          // Preserve sessionTracking from live state if imported file predates v3
          sessionTracking: progress.sessionTracking ?? state.sessionTracking,
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          trackDailyVisit: _trackDailyVisit,
          ...data
        } = get()
        return data
      },

      trackDailyVisit: () =>
        set((state) => {
          const today = new Date().toISOString().split('T')[0]
          const existing = state.sessionTracking

          // No-op if already tracked today
          if (existing?.lastVisitDate === today) return state

          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          const prevStreak = existing?.currentStreak ?? 0
          const newStreak = existing?.lastVisitDate === yesterday ? prevStreak + 1 : 1
          const newLongest = Math.max(existing?.longestStreak ?? 0, newStreak)

          const prevDates = existing?.visitDates ?? []
          const visitDates = [...prevDates.filter((d) => d !== today), today].slice(-30)

          return {
            sessionTracking: {
              firstVisit: existing?.firstVisit ?? Date.now(),
              lastVisitDate: today,
              totalSessions: (existing?.totalSessions ?? 0) + 1,
              currentStreak: newStreak,
              longestStreak: newLongest,
              visitDates,
            },
          }
        }),
    }),
    {
      name: 'pki-module-storage',
      version: 3,
      // Migration function for handling state version upgrades
      migrate: (persistedState: unknown, version: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = persistedState as any

        // Version 0 → Version 1: Ensure all required fields exist
        if (version === 0) {
          state.artifacts = state.artifacts || { keys: [], certificates: [], csrs: [] }
          state.preferences = state.preferences || {
            theme: 'dark',
            defaultKeyType: 'RSA',
            autoSave: true,
          }
          state.notes = state.notes || {}
          state.ejbcaConnections = state.ejbcaConnections || {}
          state.version = '1.0.0'
          state.timestamp = state.timestamp || Date.now()
        }

        // Version 1 → Version 2: Fix timeSpent bug where ms were saved instead of minutes
        if (version <= 1) {
          if (state.modules) {
            Object.keys(state.modules).forEach((moduleId) => {
              const mod = state.modules[moduleId]
              // If timeSpent > 2000, it's virtually guaranteed to be raw milliseconds
              // (2000 minutes = ~33 hours in a single module, effectively impossible)
              if (mod && typeof mod.timeSpent === 'number' && mod.timeSpent > 2000) {
                // Convert back to minutes
                mod.timeSpent = Math.max(1, Math.round(mod.timeSpent / 60000))
              }
            })
          }
          state.version = '2.0.0'
          state.timestamp = Date.now()
        }

        // Version 2 → Version 3: Add sessionTracking field
        if (version <= 2) {
          if (!state.sessionTracking) {
            const today = new Date().toISOString().split('T')[0]
            state.sessionTracking = {
              firstVisit: state.timestamp ?? Date.now(),
              lastVisitDate: today,
              totalSessions: 1,
              currentStreak: 1,
              longestStreak: 1,
              visitDates: [today],
            }
          }
          state.version = '3.0.0'
          state.timestamp = Date.now()
        }

        return state
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('Module store rehydration failed:', error)
        }
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
      const persistData = { state: progress, version: 3 }
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
