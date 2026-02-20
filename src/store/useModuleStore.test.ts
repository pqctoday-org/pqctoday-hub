import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useModuleStore } from './useModuleStore'
import * as analytics from '../utils/analytics'
vi.mock('../utils/analytics', () => ({
  logModuleStart: vi.fn(),
  logStepComplete: vi.fn(),
  logArtifactGenerated: vi.fn(),
}))

describe('useModuleStore', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
  let mockLink: any

  beforeEach(() => {
    vi.clearAllMocks()
    useModuleStore.getState().resetProgress()

    // Mock URL and createElement for saveProgress
    mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }

    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test')
    global.URL.revokeObjectURL = vi.fn()
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
      if (tagName === 'a') return mockLink as any
      return document.createElement(tagName)
    })
  })

  it('initializes with default state', () => {
    const state = useModuleStore.getState()
    expect(state.version).toBe('1.0.0')
    expect(state.modules['module-1']).toBeDefined()
    expect(state.modules['module-1'].status).toBe('not-started')
  })

  it('updates module progress and logs start if not started', () => {
    useModuleStore.getState().updateModuleProgress('module-1', { status: 'in-progress' })
    const state = useModuleStore.getState()
    expect(state.modules['module-1'].status).toBe('in-progress')
    expect(analytics.logModuleStart).toHaveBeenCalledWith('module-1')
  })

  it('does not log start if already in progress', () => {
    useModuleStore.getState().updateModuleProgress('module-1', { status: 'in-progress' })
    vi.clearAllMocks()
    useModuleStore.getState().updateModuleProgress('module-1', { timeSpent: 100 })
    expect(analytics.logModuleStart).not.toHaveBeenCalled()
  })

  it('marks step complete', () => {
    useModuleStore.getState().markStepComplete('module-1', 'step-1')
    const state = useModuleStore.getState()
    expect(state.modules['module-1'].completedSteps).toContain('step-1')
    expect(analytics.logStepComplete).toHaveBeenCalledWith('module-1', 0)
  })

  it('does not duplicate completed steps', () => {
    useModuleStore.getState().markStepComplete('module-1', 'step-1')
    vi.clearAllMocks()
    useModuleStore.getState().markStepComplete('module-1', 'step-1')
    const state = useModuleStore.getState()
    expect(state.modules['module-1'].completedSteps).toEqual(['step-1'])
    expect(analytics.logStepComplete).not.toHaveBeenCalled()
  })

  it('adds a key artifact', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    const key = { id: 'k1' } as any
    useModuleStore.getState().addKey(key)
    expect(useModuleStore.getState().artifacts.keys).toContain(key)
    expect(analytics.logArtifactGenerated).toHaveBeenCalledWith('learning', 'key')
  })

  it('adds a certificate artifact', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    const cert = { id: 'c1' } as any
    useModuleStore.getState().addCertificate(cert)
    expect(useModuleStore.getState().artifacts.certificates).toContain(cert)
    expect(analytics.logArtifactGenerated).toHaveBeenCalledWith('learning', 'certificate')
  })

  it('adds a CSR artifact', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    const csr = { id: 'csr1' } as any
    useModuleStore.getState().addCSR(csr)
    expect(useModuleStore.getState().artifacts.csrs).toContain(csr)
    expect(analytics.logArtifactGenerated).toHaveBeenCalledWith('learning', 'csr')
  })

  it('loads progress', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    const customProgress = { version: '2.0.0', preferences: { theme: 'light' } } as any
    useModuleStore.getState().loadProgress(customProgress)
    expect(useModuleStore.getState().version).toBe('2.0.0')
    expect(useModuleStore.getState().preferences.theme).toBe('light')
  })

  it('resets a specific module', () => {
    useModuleStore
      .getState()
      .updateModuleProgress('module-1', { status: 'completed', timeSpent: 500 })
    useModuleStore.getState().resetModuleProgress('module-1')
    const mod = useModuleStore.getState().modules['module-1']
    expect(mod.status).toBe('not-started')
    expect(mod.timeSpent).toBe(0)
  })

  it('gets full progress without functions', () => {
    const progress = useModuleStore.getState().getFullProgress()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- checking function exclusion
    expect((progress as any).saveProgress).toBeUndefined()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- checking function exclusion
    expect((progress as any).loadProgress).toBeUndefined()
    expect(progress.version).toBe('1.0.0')
  })

  it('saves progress to file', () => {
    useModuleStore.getState().saveProgress()
    expect(global.URL.createObjectURL).toHaveBeenCalled()
    expect(mockLink.click).toHaveBeenCalled()
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test')
  })

  it('migrates from version 0 to 1', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
    const migrate = (useModuleStore.persist.getOptions() as any).migrate
    const v0State = { timestamp: 123 }
    const migrated = migrate(v0State, 0)
    expect(migrated.version).toBe('1.0.0')
    expect(migrated.artifacts).toBeDefined()
    expect(migrated.timestamp).toBe(123)
  })

  it('handles other versions in migrate', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
    const migrate = (useModuleStore.persist.getOptions() as any).migrate
    const v1State = { version: '1.0.0', custom: true }
    const migrated = migrate(v1State, 1)
    expect(migrated).toEqual(v1State)
  })

  it('handles beforeunload event to save to localStorage', () => {
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem')
    useModuleStore.getState().updateModuleProgress('module-1', { timeSpent: 10 })
    window.dispatchEvent(new Event('beforeunload'))
    expect(storageSpy).toHaveBeenCalledWith(
      'pki-module-storage',
      expect.stringContaining('"timeSpent":10')
    )
    storageSpy.mockRestore()
  })

  it('handles QuotaExceededError smoothly on beforeunload', () => {
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const err = new Error('Quota exceeded')
      err.name = 'QuotaExceededError'
      throw err
    })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    window.dispatchEvent(new Event('pagehide'))
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Storage quota exceeded'))
    consoleSpy.mockRestore()
    storageSpy.mockRestore()
  })

  it('handles generic error on beforeunload', () => {
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Some other error')
    })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    window.dispatchEvent(new Event('pagehide'))
    expect(consoleSpy).toHaveBeenCalledWith('Failed to save progress on unload:', expect.any(Error))
    consoleSpy.mockRestore()
    storageSpy.mockRestore()
  })
})
