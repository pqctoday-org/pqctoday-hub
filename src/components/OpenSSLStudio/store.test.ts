import { describe, it, expect, beforeEach } from 'vitest'
import { useOpenSSLStore } from './store'
import type { VirtualFile } from './store'

describe('useOpenSSLStore', () => {
  beforeEach(() => {
    // Clear local storage to reset persistence engine issues
    localStorage.clear()
    // Reset the store state to its initial state
    const { resetStore } = useOpenSSLStore.getState()
    resetStore()
  })

  // ---- FILE SYSTEM TESTS ----
  describe('File System Actions', () => {
    it('can add and retrieve files', () => {
      const file: VirtualFile = {
        name: 'test.txt',
        type: 'text',
        content: 'hello',
        size: 5,
        timestamp: 1234,
      }
      const state = useOpenSSLStore.getState()

      state.addFile(file)
      expect(useOpenSSLStore.getState().files).toHaveLength(1)

      const retrieved = useOpenSSLStore.getState().getFile('test.txt')
      expect(retrieved).toEqual(file)
    })

    it('replaces a file with the same name during add', () => {
      const store = useOpenSSLStore.getState()
      const file1: VirtualFile = {
        name: 'test.txt',
        type: 'text',
        content: 'hello',
        size: 5,
        timestamp: 1234,
      }
      const file2: VirtualFile = {
        name: 'test.txt',
        type: 'text',
        content: 'new-hello',
        size: 9,
        timestamp: 5678,
      }

      store.addFile(file1)
      store.addFile(file2)

      const state = useOpenSSLStore.getState()
      expect(state.files).toHaveLength(1)
      expect(state.files[0].content).toBe('new-hello')
    })

    it('can remove files', () => {
      const store = useOpenSSLStore.getState()
      const file: VirtualFile = {
        name: 'test.txt',
        type: 'text',
        content: 'hello',
        size: 5,
        timestamp: 1234,
      }

      store.addFile(file)
      expect(useOpenSSLStore.getState().files).toHaveLength(1)

      store.removeFile('test.txt')
      expect(useOpenSSLStore.getState().files).toHaveLength(0)
    })

    it('can clear all files and reset viewing/editing files', () => {
      const store = useOpenSSLStore.getState()
      const file: VirtualFile = {
        name: 'test.txt',
        type: 'text',
        content: 'hello',
        size: 5,
        timestamp: 1234,
      }

      store.addFile(file)
      store.setViewingFile(file)
      store.setEditingFile(file)

      expect(useOpenSSLStore.getState().files).toHaveLength(1)
      expect(useOpenSSLStore.getState().viewingFile).toBeTruthy()
      expect(useOpenSSLStore.getState().editingFile).toBeTruthy()

      store.clearFiles()

      const state = useOpenSSLStore.getState()
      expect(state.files).toHaveLength(0)
      expect(state.viewingFile).toBeNull()
      expect(state.editingFile).toBeNull()
    })
  })

  // ---- TERMINAL LOG TESTS ----
  describe('Terminal Logging Actions', () => {
    it('can add terminal logs', () => {
      const store = useOpenSSLStore.getState()

      store.addLog('info', 'First log')
      store.addLog('error', 'Second error')

      const state = useOpenSSLStore.getState()
      expect(state.logs).toHaveLength(2)
      expect(state.logs[0].message).toBe('First log')
      expect(state.logs[1].type).toBe('error')
    })

    it('can clear terminal logs', () => {
      const store = useOpenSSLStore.getState()
      store.addLog('info', 'A log')
      store.clearTerminalLogs()

      expect(useOpenSSLStore.getState().logs).toHaveLength(0)
    })
  })

  // ---- STRUCTURED LOG TESTS ----
  describe('Structured Logging Actions', () => {
    it('can add structured logs at the beginning of the list', () => {
      const store = useOpenSSLStore.getState()

      store.addStructuredLog({
        command: 'cmd1',
        operationType: 'Key Gen',
        details: 'info1',
        executionTime: 1,
      })
      store.addStructuredLog({
        command: 'cmd2',
        operationType: 'Sign',
        details: 'info2',
        executionTime: 2,
      })

      const state = useOpenSSLStore.getState()
      expect(state.structuredLogs).toHaveLength(2)
      // Latest log should be first
      expect(state.structuredLogs[0].command).toBe('cmd2')
      expect(state.structuredLogs[1].command).toBe('cmd1')
    })

    it('can clear structured logs', () => {
      const store = useOpenSSLStore.getState()
      store.addStructuredLog({
        command: 'cmd1',
        operationType: 'Key Gen',
        details: 'info1',
        executionTime: 1,
      })
      store.clearStructuredLogs()

      expect(useOpenSSLStore.getState().structuredLogs).toHaveLength(0)
    })
  })

  // ---- UI / COMMAND STATE TESTS ----
  describe('UI and Command State Actions', () => {
    it('can set active tab', () => {
      const store = useOpenSSLStore.getState()
      store.setActiveTab('logs')
      expect(useOpenSSLStore.getState().activeTab).toBe('logs')
    })

    it('can set command string', () => {
      const store = useOpenSSLStore.getState()
      store.setCommand('openssl version')
      expect(useOpenSSLStore.getState().command).toBe('openssl version')
    })

    it('can toggle processing states', () => {
      const store = useOpenSSLStore.getState()

      store.setIsProcessing(true)
      expect(useOpenSSLStore.getState().isProcessing).toBe(true)

      store.setIsReady(true)
      expect(useOpenSSLStore.getState().isReady).toBe(true)
    })

    it('can track last execution metrics', () => {
      const store = useOpenSSLStore.getState()
      store.setLastExecutionTime(120)
      expect(useOpenSSLStore.getState().lastExecutionTime).toBe(120)
    })

    it('resetStore clears everything to default', () => {
      const store = useOpenSSLStore.getState()
      const file: VirtualFile = {
        name: 'test.txt',
        type: 'text',
        content: 'hello',
        size: 5,
        timestamp: 1234,
      }

      store.addFile(file)
      store.addLog('info', 'log')
      store.setActiveTab('logs')
      store.setCommand('cmd')
      store.setIsProcessing(true)
      store.setIsReady(true)
      store.setLastExecutionTime(200)

      store.resetStore()

      const state = useOpenSSLStore.getState()
      expect(state.files).toHaveLength(0)
      expect(state.logs).toHaveLength(0)
      expect(state.command).toBe('')
      expect(state.isProcessing).toBe(false)
      expect(state.isReady).toBe(false)
      expect(state.lastExecutionTime).toBeNull()
      // Note activeTab wasn't reset by resetStore
    })
  })

  // ---- PERSISTENCE / LOCAL_STORAGE MECHANISM TESTS ----
  describe('Zustand Persist Mechanics', () => {
    // We re-import the store initialization flow conceptually to test the persist storage directly
    // Using the internal storage exported by the middleware wrapper
    it('serializes Uint8Arrays inside persistence wrapper correctly', () => {
      // Force trigger the getItem and setItem
      const store = useOpenSSLStore.getState()
      const data = new Uint8Array([1, 2, 3])
      const file: VirtualFile = {
        name: 'bin.bin',
        type: 'binary',
        content: data,
        size: 3,
        timestamp: 1234,
      }

      store.addFile(file)

      // Zustand persist triggers setItem asynchronously, or on mount.
      // Instead, we will test the functions directly if possible, or trigger a full state dump via localstorage mocking.
      // Wait, we can just read from the localStorage item since it's synchronous in our test env.
      const dumped = localStorage.getItem('openssl-studio-storage')
      expect(dumped).toBeTruthy()

      if (dumped) {
        expect(dumped).toContain('"type":"Buffer"')
        expect(dumped).toContain('"data":[1,2,3]')
      }
    })

    it('deserializes Uint8Arrays properly upon store hydration', () => {
      // Setup raw localStorage payload representing what was serialized
      const payload = {
        state: {
          files: [
            {
              name: 'hydrated.bin',
              type: 'binary',
              content: { type: 'Buffer', data: [7, 8, 9] },
              size: 3,
              timestamp: 999,
            },
          ],
          structuredLogs: [],
        },
        version: 0,
      }
      localStorage.setItem('openssl-studio-storage', JSON.stringify(payload))

      // Re-initialize or re-hydrate (in a test environment, Zustand might not auto hydrate,
      // but we can trigger it or assume since persist storage wrapper exposes functions we can test them via the DOM
      // In zustand 4, persist is accessible via `useOpenSSLStore.persist`)
      useOpenSSLStore.persist.rehydrate()

      const files = useOpenSSLStore.getState().files
      expect(files).toHaveLength(1)
      expect(files[0].content).toBeInstanceOf(Uint8Array)
      expect(Array.from(files[0].content as Uint8Array)).toEqual([7, 8, 9])
    })

    it('handles corrupted localStorage data without crashing', () => {
      localStorage.setItem('openssl-studio-storage', '{ broken json ')
      expect(() => {
        useOpenSSLStore.persist.rehydrate()
      }).not.toThrowError() // Rehydration safely handles JSON corruption.
    })

    it('returns null when getItem encounters empty storage', () => {
      localStorage.removeItem('openssl-studio-storage')
      // rehydrate will clear everything and take initial state
      useOpenSSLStore.persist.rehydrate()
      expect(useOpenSSLStore.getState().files).toHaveLength(0)
    })
  })
})
