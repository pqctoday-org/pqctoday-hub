import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

  // Editor State
  editingFile: VirtualFile | null
  setEditingFile: (file: VirtualFile | null) => void

  // Metrics
  lastExecutionTime: number | null
  setLastExecutionTime: (time: number | null) => void
  resetStore: () => void
}

export const useOpenSSLStore = create<OpenSSLStudioState>()(
  persist(
    (set, get) => ({
      files: [],
      addFile: (file) =>
        set((state) => ({ files: [...state.files.filter((f) => f.name !== file.name), file] })),
      removeFile: (name) => set((state) => ({ files: state.files.filter((f) => f.name !== name) })),
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

      // Editor State
      editingFile: null,
      setEditingFile: (file) => set({ editingFile: file }),

      // Metrics
      lastExecutionTime: null,
      setLastExecutionTime: (time) => set({ lastExecutionTime: time }),

      resetStore: () => set({
        files: [],
        logs: [],
        structuredLogs: [],
        command: '',
        isProcessing: false,
        editingFile: null,
        lastExecutionTime: null
      }),
    }),
    {
      name: 'openssl-studio-storage',
      partialize: (state) => ({
        files: state.files,
        structuredLogs: state.structuredLogs,
        // Don't persist active tab, processing state, or editor state
      }),
    }
  )
)
