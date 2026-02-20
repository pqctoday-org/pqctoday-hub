/* eslint-disable */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { openSSLService } from './OpenSSLService'

// Mock the Worker
const mockPostMessage = vi.fn()
const mockTerminate = vi.fn()

class MockWorker {
  postMessage = mockPostMessage
  terminate = mockTerminate
  onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null
  onerror: ((this: Worker, ev: ErrorEvent) => any) | null = null
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
  dispatchEvent = vi.fn()

  constructor(_scriptURL: string | URL, _options?: WorkerOptions) {}
}

// @ts-ignore
global.Worker = MockWorker

describe('OpenSSLService Stability', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    // Reset service state (hacky access to private members)
    ;(openSSLService as any).isReady = false
    ;(openSSLService as any).readyPromise = null
    ;(openSSLService as any).worker = null
    ;(openSSLService as any).pendingRequests = new Map()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('init() should timeout if worker does not respond', async () => {
    const initPromise = openSSLService.init()

    // Fast-forward time
    vi.advanceTimersByTime(30001) // > 30s timeout

    await expect(initPromise).rejects.toThrow('OpenSSL initialization timed out')
    expect(mockTerminate).toHaveBeenCalled()
  })

  it('init() should reject if worker reports ERROR', async () => {
    const initPromise = openSSLService.init()

    // access the private worker instance
    const worker = (openSSLService as any).worker

    // Simulate error from worker
    if (worker && worker.onmessage) {
      worker.onmessage({
        data: { type: 'ERROR', error: 'Failed to load script' },
      } as MessageEvent)
    }

    await expect(initPromise).rejects.toThrow('Failed to load script')
    expect(mockTerminate).toHaveBeenCalled()
  })

  it('init() should reject if worker throws onerror', async () => {
    const initPromise = openSSLService.init()

    const worker = (openSSLService as any).worker

    // Simulate worker error
    if (worker && worker.onerror) {
      // @ts-ignore
      worker.onerror(new Error('Network error'))
    }

    await expect(initPromise).rejects.toThrow('Network error')
    expect(mockTerminate).toHaveBeenCalled()
  })

  it('execute() should timeout if command hangs', async () => {
    // Mock successful init
    const initPromise = openSSLService.init()
    const worker = (openSSLService as any).worker

    if (worker && worker.onmessage) {
      worker.onmessage({
        data: { type: 'READY' },
      } as MessageEvent)
    }
    await initPromise

    const execPromise = openSSLService.execute('openssl help')

    // Ensure promise created
    await Promise.resolve()

    // Fast-forward time
    vi.runAllTimers()

    await expect(execPromise).rejects.toThrow('OpenSSL command timed out')
  }, 10000)

  it('should recover from failed init', async () => {
    // 1. Fail first init
    const initPromise1 = openSSLService.init()
    vi.advanceTimersByTime(30001)
    await expect(initPromise1).rejects.toThrow()

    // 2. Try again (should create new worker)
    const initPromise2 = openSSLService.init()
    // We can't check call count on the class easily unless we spy on `global.Worker` but it is the class itself.
    // We can spy on the prototype? or just trust the functional behavior.

    const worker = (openSSLService as any).worker

    // Succeed this time
    if (worker && worker.onmessage) {
      worker.onmessage({
        data: { type: 'READY' },
      } as MessageEvent)
    }
    await expect(initPromise2).resolves.toBeUndefined()
  })
})

describe('OpenSSLService Functionality', () => {
  beforeEach(async () => {
    vi.useRealTimers()
    vi.clearAllMocks()
    ;(openSSLService as any).resetState()

    // Auto-resolve init for these tests
    const initPromise = openSSLService.init()
    const worker = (openSSLService as any).worker
    if (worker && worker.onmessage) {
      worker.onmessage({ data: { type: 'READY' } } as MessageEvent)
    }
    await initPromise
  })

  // No afterEach needed for real timers

  it('execute() sends correct command structure to worker', async () => {
    const worker = (openSSLService as any).worker
    const postMessageMock = vi.fn((data: any) => {
      const { requestId } = data
      // Simulate immediate response
      worker.onmessage({
        data: { type: 'DONE', requestId, result: {} },
      } as MessageEvent)
    })
    worker.postMessage = postMessageMock

    await openSSLService.execute('openssl req -new -key key.pem')

    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'COMMAND',
        command: 'req',
        args: ['-new', '-key', 'key.pem'],
      })
    )
  })

  it('execute() handles quoted arguments correctly', async () => {
    const worker = (openSSLService as any).worker
    const postMessageMock = vi.fn((data: any) => {
      const { requestId } = data
      worker.onmessage({
        data: { type: 'DONE', requestId, result: {} },
      } as MessageEvent)
    })
    worker.postMessage = postMessageMock

    await openSSLService.execute('openssl req -subj "/C=US/O=Test Org"')

    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        args: ['-subj', '/C=US/O=Test Org'],
      })
    )
  })

  it('execute() captures stdout and stderr correctly', async () => {
    const worker = (openSSLService as any).worker
    const postMessageMock = vi.fn((data: any) => {
      const { requestId } = data
      worker.onmessage({
        data: { type: 'LOG', stream: 'stdout', message: 'OpenSSL 3.0', requestId },
      } as MessageEvent)
      worker.onmessage({
        data: { type: 'LOG', stream: 'stderr', message: 'Warning', requestId },
      } as MessageEvent)
      worker.onmessage({
        data: { type: 'LOG', stream: 'stdout', message: '[Debug] ignored', requestId },
      } as MessageEvent)
      worker.onmessage({ data: { type: 'DONE', requestId } } as MessageEvent)
    })
    worker.postMessage = postMessageMock

    const result = await openSSLService.execute('version')

    expect(result.stdout).toContain('OpenSSL 3.0')
    expect(result.stderr).toContain('Warning')
    expect(result.stdout).not.toContain('[Debug] ignored')
  })

  it('execute() collects created files', async () => {
    const worker = (openSSLService as any).worker
    const fileData = new Uint8Array([1, 2, 3])

    const postMessageMock = vi.fn((data: any) => {
      const { requestId } = data
      worker.onmessage({
        data: {
          type: 'FILE_CREATED',
          name: 'key.pem',
          data: fileData,
          requestId,
        },
      } as MessageEvent)
      worker.onmessage({ data: { type: 'DONE', requestId } } as MessageEvent)
    })
    worker.postMessage = postMessageMock

    const result = await openSSLService.execute('genrsa')
    expect(result.files).toHaveLength(1)
    expect(result.files[0]).toEqual({ name: 'key.pem', data: fileData })
  })

  it('execute() handles worker execution errors', async () => {
    const worker = (openSSLService as any).worker
    const postMessageMock = vi.fn((data: any) => {
      const { requestId } = data
      worker.onmessage({
        data: { type: 'ERROR', error: 'Unknown command', requestId },
      } as MessageEvent)
      worker.onmessage({ data: { type: 'DONE', requestId } } as MessageEvent)
    })
    worker.postMessage = postMessageMock

    const execPromise = openSSLService.execute('badcmd')
    await expect(execPromise).rejects.toThrow('Unknown command')
  })

  it('execute() throws if worker fails to initialize entirely', async () => {
    ;(openSSLService as any).worker = null
    const initSpy = vi.spyOn(openSSLService, 'init').mockRejectedValue(new Error('init fail'))
    await expect(openSSLService.execute('test')).rejects.toThrow(
      'OpenSSL Service not available: init fail'
    )
    initSpy.mockRestore()
  })

  it('execute() throws if worker is magically null after init', async () => {
    const initSpy = vi.spyOn(openSSLService, 'init').mockResolvedValue(undefined)
    ;(openSSLService as any).worker = null
    await expect(openSSLService.execute('test')).rejects.toThrow('Worker not initialized')
    initSpy.mockRestore()
  })

  describe('deleteFile()', () => {
    it('deletes file successfully', async () => {
      const worker = (openSSLService as any).worker
      const postMessageMock = vi.fn((data: any) => {
        worker.onmessage({ data: { type: 'DONE', requestId: data.requestId } } as MessageEvent)
      })
      worker.postMessage = postMessageMock

      await openSSLService.deleteFile('test.pem')
      expect(postMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'DELETE_FILE', name: 'test.pem' })
      )
    })

    it('returns early if init fails', async () => {
      const initSpy = vi.spyOn(openSSLService, 'init').mockRejectedValue(new Error('init fail'))
      await expect(openSSLService.deleteFile('test.pem')).resolves.toBeUndefined()
      initSpy.mockRestore()
    })

    it('returns early if worker is null', async () => {
      const initSpy = vi.spyOn(openSSLService, 'init').mockResolvedValue(undefined)
      ;(openSSLService as any).worker = null
      await expect(openSSLService.deleteFile('test.pem')).resolves.toBeUndefined()
      initSpy.mockRestore()
    })

    it('handles worker deletion error gracefully', async () => {
      const worker = (openSSLService as any).worker
      const postMessageMock = vi.fn((data: any) => {
        worker.onmessage({
          data: { type: 'ERROR', error: 'no such file', requestId: data.requestId },
        } as MessageEvent)
        worker.onmessage({ data: { type: 'DONE', requestId: data.requestId } } as MessageEvent)
      })
      worker.postMessage = postMessageMock

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await openSSLService.deleteFile('test.pem')
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[OpenSSLService] Delete failed:',
        expect.any(Error)
      )
      consoleWarnSpy.mockRestore()
    })

    it('handles timeout in deleteFile', async () => {
      vi.useFakeTimers()
      const worker = (openSSLService as any).worker
      worker.postMessage = vi.fn() // Do nothing to trigger timeout
      const p = openSSLService.deleteFile('test.pem')
      await Promise.resolve()
      vi.advanceTimersByTime(5001)
      await expect(p).resolves.toBeUndefined()
      vi.useRealTimers()
    })
  })

  describe('simulateTLS()', () => {
    it('parses structured JSON result from stdout', async () => {
      const worker = (openSSLService as any).worker
      const postMessageMock = vi.fn((data: any) => {
        worker.onmessage({
          data: {
            type: 'LOG',
            stream: 'stdout',
            message: 'SIMULATION_RESULT:{"success":true}',
            requestId: data.requestId,
          },
        } as MessageEvent)
        worker.onmessage({ data: { type: 'DONE', requestId: data.requestId } } as MessageEvent)
      })
      worker.postMessage = postMessageMock

      const result = await openSSLService.simulateTLS('client', 'server')
      expect(result).toBe('{"success":true}')
    })

    it('falls back to stdout if no structured result', async () => {
      const worker = (openSSLService as any).worker
      const postMessageMock = vi.fn((data: any) => {
        worker.onmessage({
          data: {
            type: 'LOG',
            stream: 'stdout',
            message: 'raw handshake data',
            requestId: data.requestId,
          },
        } as MessageEvent)
        worker.onmessage({ data: { type: 'DONE', requestId: data.requestId } } as MessageEvent)
      })
      worker.postMessage = postMessageMock

      const result = await openSSLService.simulateTLS('client', 'server')
      expect(result.trim()).toBe('raw handshake data')
    })

    it('rejects with stderr if no structured result and stderr exists', async () => {
      const worker = (openSSLService as any).worker
      const postMessageMock = vi.fn((data: any) => {
        worker.onmessage({
          data: {
            type: 'LOG',
            stream: 'stderr',
            message: 'connection refused',
            requestId: data.requestId,
          },
        } as MessageEvent)
        worker.onmessage({ data: { type: 'DONE', requestId: data.requestId } } as MessageEvent)
      })
      worker.postMessage = postMessageMock

      await expect(openSSLService.simulateTLS('client', 'server')).rejects.toThrow(
        'connection refused'
      )
    })

    it('rejects on execution error', async () => {
      const worker = (openSSLService as any).worker
      const postMessageMock = vi.fn((data: any) => {
        worker.onmessage({
          data: { type: 'ERROR', error: 'sim fail', requestId: data.requestId },
        } as MessageEvent)
        worker.onmessage({ data: { type: 'DONE', requestId: data.requestId } } as MessageEvent)
      })
      worker.postMessage = postMessageMock

      await expect(openSSLService.simulateTLS('client', 'server')).rejects.toThrow('sim fail')
    })

    it('handles initialization failure', async () => {
      const initSpy = vi.spyOn(openSSLService, 'init').mockRejectedValue(new Error('init fail'))
      await expect(openSSLService.simulateTLS('client', 'server')).rejects.toThrow(
        'OpenSSL Service not available: Error: init fail'
      )
      initSpy.mockRestore()
    })

    it('throws if worker is missing', async () => {
      const initSpy = vi.spyOn(openSSLService, 'init').mockResolvedValue(undefined)
      ;(openSSLService as any).worker = null
      await expect(openSSLService.simulateTLS('client', 'server')).rejects.toThrow(
        'Worker not initialized'
      )
      initSpy.mockRestore()
    })

    it('handles timeout in simulateTLS', async () => {
      vi.useFakeTimers()
      const worker = (openSSLService as any).worker
      worker.postMessage = vi.fn() // Do nothing
      const p = openSSLService.simulateTLS('client', 'server')
      await Promise.resolve()
      vi.advanceTimersByTime(60001)
      await expect(p).rejects.toThrow('TLS Simulation timed out')
      vi.useRealTimers()
    })
  })

  describe('executeSkey()', () => {
    it('sends correct message for skey operation', async () => {
      const worker = (openSSLService as any).worker
      const postMessageMock = vi.fn((data: any) => {
        worker.onmessage({ data: { type: 'DONE', requestId: data.requestId } } as MessageEvent)
      })
      worker.postMessage = postMessageMock

      await openSSLService.executeSkey('create', { key: 'value' })
      expect(postMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SKEY_OPERATION',
          opType: 'create',
          params: { key: 'value' },
        })
      )
    })

    it('handles initialization failure', async () => {
      const initSpy = vi.spyOn(openSSLService, 'init').mockRejectedValue(new Error('init fail'))
      await expect(openSSLService.executeSkey('create', {})).rejects.toThrow(
        'OpenSSL Service not available: Error: init fail'
      )
      initSpy.mockRestore()
    })

    it('throws if worker is missing', async () => {
      const initSpy = vi.spyOn(openSSLService, 'init').mockResolvedValue(undefined)
      ;(openSSLService as any).worker = null
      await expect(openSSLService.executeSkey('create', {})).rejects.toThrow(
        'Worker not initialized'
      )
      initSpy.mockRestore()
    })

    it('handles worker error', async () => {
      const worker = (openSSLService as any).worker
      const postMessageMock = vi.fn((data: any) => {
        worker.onmessage({
          data: { type: 'ERROR', error: 'skey fail', requestId: data.requestId },
        } as MessageEvent)
        worker.onmessage({ data: { type: 'DONE', requestId: data.requestId } } as MessageEvent)
      })
      worker.postMessage = postMessageMock

      await expect(openSSLService.executeSkey('create', {})).rejects.toThrow('skey fail')
    })

    it('handles timeout in executeSkey', async () => {
      vi.useFakeTimers()
      const worker = (openSSLService as any).worker
      worker.postMessage = vi.fn()
      const p = openSSLService.executeSkey('create', {})
      await Promise.resolve()
      vi.advanceTimersByTime(60001)
      await expect(p).rejects.toThrow('SKEY Operation timed out')
      vi.useRealTimers()
    })
  })

  describe('handleMessage Edge Cases', () => {
    it('ignores messages without requestId or unknown requestId', async () => {
      const worker = (openSSLService as any).worker
      // Should not throw or crash
      worker.onmessage({ data: { type: 'LOG', stream: 'stdout', message: 'test' } } as MessageEvent)
      worker.onmessage({
        data: { type: 'LOG', stream: 'stdout', message: 'test', requestId: 'unknown' },
      } as MessageEvent)
    })
  })
})
