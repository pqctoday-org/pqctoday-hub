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

    await expect(execPromise).rejects.toThrow('Command timed out')
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
})
