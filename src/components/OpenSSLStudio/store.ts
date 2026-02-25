import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useModuleStore } from '../../store/useModuleStore'

export interface VirtualFile {
  name: string
  type: 'key' | 'cert' | 'csr' | 'config' | 'binary' | 'text'
  content: Uint8Array | string
  size: number
  timestamp: number
  executionTime?: number
}

export interface LogEntry {
  id: string
  timestamp: string
  type: 'stdout' | 'stderr' | 'info' | 'error'
  message: string
}

export interface StructuredLogEntry {
  id: string
  timestamp: string
  command: string
  operationType: 'Key Gen' | 'Sign' | 'Verify' | 'Cert Gen' | 'Other'
  details: string
  fileName?: string
  fileSize?: number
  executionTime: number
}

interface OpenSSLStudioState {
  // File System
  files: VirtualFile[]
  addFile: (file: VirtualFile) => void
  removeFile: (name: string) => void
  clearFiles: () => void
  getFile: (name: string) => VirtualFile | undefined

  // Terminal Output
  logs: LogEntry[]
  addLog: (type: LogEntry['type'], message: string) => void
  clearTerminalLogs: () => void

  // Structured Logs
  structuredLogs: StructuredLogEntry[]
  addStructuredLog: (entry: Omit<StructuredLogEntry, 'id' | 'timestamp'>) => void
  clearStructuredLogs: () => void

  // UI State
  activeTab: 'terminal' | 'logs'
  setActiveTab: (tab: 'terminal' | 'logs') => void

  // Command Builder
  command: string
  setCommand: (cmd: string) => void
  isProcessing: boolean
  setIsProcessing: (isProcessing: boolean) => void
  isReady: boolean
  setIsReady: (isReady: boolean) => void

  // Editor State
  editingFile: VirtualFile | null
  setEditingFile: (file: VirtualFile | null) => void

  // Viewer State
  viewingFile: VirtualFile | null
  setViewingFile: (file: VirtualFile | null) => void

  // Metrics
  lastExecutionTime: number | null
  setLastExecutionTime: (time: number | null) => void
  resetStore: () => void
}

export const useOpenSSLStore = create<OpenSSLStudioState>()(
  persist(
    (set, get) => ({
      files: [],
      addFile: (file) => {
        // Bridge: sync key/cert/csr creation to the scoring system
        if (file.type === 'key' || file.type === 'cert' || file.type === 'csr') {
          const moduleStore = useModuleStore.getState()
          const fileId = `openssl::${file.name}`
          const content = typeof file.content === 'string' ? file.content : ''
          if (file.type === 'key' && !moduleStore.artifacts.keys.some((k) => k.id === fileId)) {
            moduleStore.addKey({
              id: fileId,
              name: file.name,
              algorithm: 'OpenSSL',
              keySize: 0,
              created: file.timestamp,
              publicKey: content,
              description: 'OpenSSL Studio',
            })
          } else if (
            file.type === 'cert' &&
            !moduleStore.artifacts.certificates.some((c) => c.id === fileId)
          ) {
            moduleStore.addCertificate({
              id: fileId,
              name: file.name,
              pem: content,
              created: file.timestamp,
              metadata: { subject: '', issuer: '', serial: '', notBefore: 0, notAfter: 0 },
              tags: ['openssl-studio'],
            })
          } else if (
            file.type === 'csr' &&
            !moduleStore.artifacts.csrs.some((c) => c.id === fileId)
          ) {
            moduleStore.addCSR({
              id: fileId,
              name: file.name,
              pem: content,
              created: file.timestamp,
            })
          }
        }
        set((state) => ({ files: [...state.files.filter((f) => f.name !== file.name), file] }))
      },
      removeFile: (name) => set((state) => ({ files: state.files.filter((f) => f.name !== name) })),
      clearFiles: () => set(() => ({ files: [], editingFile: null, viewingFile: null })),
      getFile: (name) => get().files.find((f) => f.name === name),

      logs: [],
      addLog: (type, message) =>
        set((state) => ({
          logs: [
            ...state.logs,
            {
              id: Math.random().toString(36).substring(2),
              timestamp: new Date().toLocaleTimeString(),
              type,
              message,
            },
          ],
        })),
      clearTerminalLogs: () => set({ logs: [] }),

      structuredLogs: [],
      addStructuredLog: (entry) =>
        set((state) => ({
          structuredLogs: [
            {
              id: Math.random().toString(36).substring(2),
              timestamp: new Date().toLocaleTimeString(),
              ...entry,
            },
            ...state.structuredLogs,
          ],
        })),
      clearStructuredLogs: () => set({ structuredLogs: [] }),

      activeTab: 'terminal',
      setActiveTab: (tab) => set({ activeTab: tab }),

      command: '',
      setCommand: (cmd) => set({ command: cmd }),
      isProcessing: false,
      setIsProcessing: (isProcessing) => set({ isProcessing }),
      isReady: false,
      setIsReady: (isReady) => set({ isReady }),

      // Editor State
      editingFile: null,
      setEditingFile: (file) => set({ editingFile: file }),

      // Viewer State
      viewingFile: null,
      setViewingFile: (file) => set({ viewingFile: file }),

      // Metrics
      lastExecutionTime: null,
      setLastExecutionTime: (time) => set({ lastExecutionTime: time }),

      resetStore: () =>
        set({
          files: [],
          logs: [],
          structuredLogs: [],
          command: '',
          isProcessing: false,
          isReady: false,
          editingFile: null,
          viewingFile: null,
          lastExecutionTime: null,
        }),
    }),

    {
      name: 'openssl-studio-storage',
      version: 1,
      partialize: (state) => ({
        files: state.files,
        structuredLogs: state.structuredLogs,
      }),
      migrate: (persistedState: unknown, version: number) => {
        const state =
          typeof persistedState === 'object' && persistedState !== null
            ? (persistedState as Record<string, unknown>)
            : {}

        if (version < 1) {
          state.files = Array.isArray(state.files) ? state.files : []
          state.structuredLogs = Array.isArray(state.structuredLogs) ? state.structuredLogs : []
        }

        return state as { files: VirtualFile[]; structuredLogs: StructuredLogEntry[] }
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error('OpenSSL Studio store rehydration failed:', error)
        }
      },
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name)
            if (!str) return null
            return JSON.parse(str, (_key, value) => {
              if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
                return new Uint8Array(value.data)
              }
              return value
            })
          } catch {
            console.error('OpenSSL Studio: failed to parse stored data, resetting')
            localStorage.removeItem(name)
            return null
          }
        },
        setItem: (name, value) => {
          const str = JSON.stringify(value, (_key, val) => {
            if (val instanceof Uint8Array) {
              return { type: 'Buffer', data: Array.from(val) }
            }
            return val
          })
          localStorage.setItem(name, str)
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
