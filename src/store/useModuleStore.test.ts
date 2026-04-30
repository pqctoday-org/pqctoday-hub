// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useModuleStore } from './useModuleStore'
import * as analytics from '../utils/analytics'
vi.mock('../utils/analytics', () => ({
  logModuleStart: vi.fn(),
  logModuleComplete: vi.fn(),
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
    expect(analytics.logStepComplete).toHaveBeenCalledWith('module-1', 0, undefined)
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

  it('migrates from version 0 to current (7), initializing all fields', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
    const migrate = (useModuleStore.persist.getOptions() as any).migrate
    const v0State = { timestamp: 123 }
    const migrated = migrate(v0State, 0)
    expect(migrated.version).toBe('14.0.0')
    expect(migrated.artifacts).toBeDefined()
    expect(migrated.artifacts.executiveDocuments).toEqual([])
    expect(migrated.sessionTracking).toBeDefined()
    expect(migrated.quizMastery).toBeDefined()
    expect(migrated.quizMastery.correctQuestionIds).toEqual([])
    expect(migrated.timestamp).toEqual(expect.any(Number))
  })

  it('migrates from version 1 to current (7), converting ms to min', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
    const migrate = (useModuleStore.persist.getOptions() as any).migrate
    const v1State = {
      version: '1.0.0',
      modules: { 'mod-1': { timeSpent: 120000 } },
      artifacts: { keys: [], certificates: [], csrs: [] },
    }
    const migrated = migrate(v1State, 1)
    expect(migrated.version).toBe('14.0.0')
    expect(migrated.modules['mod-1'].timeSpent).toBe(2)
    expect(migrated.sessionTracking).toBeDefined()
    expect(migrated.quizMastery).toBeDefined()
    expect(migrated.artifacts.executiveDocuments).toEqual([])
  })

  it('migrates from version 3 to current (7), adding quizMastery and executiveDocuments', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
    const migrate = (useModuleStore.persist.getOptions() as any).migrate
    const v3State = { version: '3.0.0', artifacts: { keys: [], certificates: [], csrs: [] } }
    const migrated = migrate(v3State, 3)
    expect(migrated.version).toBe('14.0.0')
    expect(migrated.quizMastery).toEqual({ correctQuestionIds: [] })
    expect(migrated.artifacts.executiveDocuments).toEqual([])
  })

  it('migrates from version 4 to current (7), adding executiveDocuments', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
    const migrate = (useModuleStore.persist.getOptions() as any).migrate
    const v4State = {
      version: '4.0.0',
      artifacts: { keys: [], certificates: [], csrs: [] },
      quizMastery: { correctQuestionIds: ['q1'] },
    }
    const migrated = migrate(v4State, 4)
    expect(migrated.version).toBe('14.0.0')
    expect(migrated.artifacts.executiveDocuments).toEqual([])
    expect(migrated.quizMastery.correctQuestionIds).toEqual(['q1'])
  })

  it('migrates from version 5 to current (7), splitting key-management into kms-pqc and hsm-pqc', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
    const migrate = (useModuleStore.persist.getOptions() as any).migrate
    const v5State = {
      version: '5.0.0',
      modules: {
        'key-management': {
          status: 'in-progress',
          lastVisited: 1000,
          timeSpent: 45,
          completedSteps: ['step-1', 'step-2'],
          quizScores: { attempt1: 80 },
        },
        'pqc-101': { status: 'completed', lastVisited: 500, timeSpent: 30, completedSteps: [] },
      },
      artifacts: { keys: [], certificates: [], csrs: [], executiveDocuments: [] },
      quizMastery: { correctQuestionIds: ['q1'] },
    }
    const migrated = migrate(v5State, 5)
    expect(migrated.version).toBe('14.0.0')
    // key-management should be removed
    expect(migrated.modules['key-management']).toBeUndefined()
    // kms-pqc should inherit status, timeSpent, quizScores but reset completedSteps
    expect(migrated.modules['kms-pqc']).toBeDefined()
    expect(migrated.modules['kms-pqc'].status).toBe('in-progress')
    expect(migrated.modules['kms-pqc'].timeSpent).toBe(45)
    expect(migrated.modules['kms-pqc'].completedSteps).toEqual([])
    // hsm-pqc should inherit status, timeSpent, quizScores but reset completedSteps
    expect(migrated.modules['hsm-pqc']).toBeDefined()
    expect(migrated.modules['hsm-pqc'].status).toBe('in-progress')
    expect(migrated.modules['hsm-pqc'].timeSpent).toBe(45)
    expect(migrated.modules['hsm-pqc'].completedSteps).toEqual([])
    // Other modules should be untouched
    expect(migrated.modules['pqc-101'].status).toBe('completed')
  })

  it('migrates from version 11 to 12, dropping retired roadmap docs and leaving inputs optional', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
    const migrate = (useModuleStore.persist.getOptions() as any).migrate
    const v11State = {
      version: '11.0.0',
      artifacts: {
        keys: [],
        certificates: [],
        csrs: [],
        executiveDocuments: [
          { id: 'a', type: 'risk-register', title: 'Keep', data: '', createdAt: 1 },
          { id: 'b', type: 'roadmap', title: 'Drop', data: '', createdAt: 2 },
          { id: 'c', type: 'board-deck', title: 'Keep', data: '', createdAt: 3, inputs: { x: 1 } },
        ],
      },
      quizMastery: { correctQuestionIds: [] },
      kpiHistory: { riskScore: [] },
    }
    const migrated = migrate(v11State, 11)
    expect(migrated.version).toBe('14.0.0')
    const ids = migrated.artifacts.executiveDocuments.map((d: { id: string }) => d.id)
    expect(ids).toEqual(['a', 'c'])
    // Records without prior `inputs` stay undefined; records with `inputs` retain them.
    const aDoc = migrated.artifacts.executiveDocuments.find((d: { id: string }) => d.id === 'a')
    const cDoc = migrated.artifacts.executiveDocuments.find((d: { id: string }) => d.id === 'c')
    expect(aDoc.inputs).toBeUndefined()
    expect(cDoc.inputs).toEqual({ x: 1 })
  })

  it('adds an executive document artifact', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    const doc = { id: 'doc1', type: 'risk-register', title: 'Test', createdAt: Date.now() } as any
    useModuleStore.getState().addExecutiveDocument(doc)
    expect(useModuleStore.getState().artifacts.executiveDocuments).toContain(doc)
    expect(analytics.logArtifactGenerated).toHaveBeenCalledWith('learning', 'executive-document')
  })

  it('updates an existing executive document', () => {
    const doc = {
      id: 'doc1',
      moduleId: 'pqc-governance',
      type: 'raci-matrix' as const,
      title: 'RACI v1',
      data: '# RACI Matrix',
      createdAt: 1000,
    }
    useModuleStore.getState().addExecutiveDocument(doc)
    useModuleStore.getState().updateExecutiveDocument('doc1', {
      title: 'RACI v2',
      data: '# Updated RACI',
    })
    const updated = useModuleStore
      .getState()
      .artifacts.executiveDocuments?.find((d) => d.id === 'doc1')
    expect(updated?.title).toBe('RACI v2')
    expect(updated?.data).toBe('# Updated RACI')
    expect(updated?.id).toBe('doc1')
    expect(updated?.createdAt).toBe(1000)
  })

  it('update is a no-op for nonexistent document id', () => {
    const doc = {
      id: 'doc1',
      moduleId: 'pqc-governance',
      type: 'raci-matrix' as const,
      title: 'RACI v1',
      data: '# RACI',
      createdAt: 1000,
    }
    useModuleStore.getState().addExecutiveDocument(doc)
    useModuleStore.getState().updateExecutiveDocument('nonexistent', { title: 'Changed' })
    const docs = useModuleStore.getState().artifacts.executiveDocuments ?? []
    expect(docs).toHaveLength(1)
    expect(docs[0].title).toBe('RACI v1')
  })

  it('deletes an executive document by id', () => {
    const doc1 = {
      id: 'doc1',
      moduleId: 'pqc-governance',
      type: 'raci-matrix' as const,
      title: 'RACI',
      data: '# RACI',
      createdAt: 1000,
    }
    const doc2 = {
      id: 'doc2',
      moduleId: 'vendor-risk',
      type: 'vendor-scorecard' as const,
      title: 'Scorecard',
      data: '# Scorecard',
      createdAt: 2000,
    }
    useModuleStore.getState().addExecutiveDocument(doc1)
    useModuleStore.getState().addExecutiveDocument(doc2)
    useModuleStore.getState().deleteExecutiveDocument('doc1')
    const docs = useModuleStore.getState().artifacts.executiveDocuments ?? []
    expect(docs).toHaveLength(1)
    expect(docs[0].id).toBe('doc2')
  })

  it('delete is a no-op for nonexistent document id', () => {
    const doc = {
      id: 'doc1',
      moduleId: 'pqc-governance',
      type: 'raci-matrix' as const,
      title: 'RACI',
      data: '# RACI',
      createdAt: 1000,
    }
    useModuleStore.getState().addExecutiveDocument(doc)
    useModuleStore.getState().deleteExecutiveDocument('nonexistent')
    const docs = useModuleStore.getState().artifacts.executiveDocuments ?? []
    expect(docs).toHaveLength(1)
  })

  it('replaces existing document with same moduleId+type instead of appending', () => {
    const doc1 = {
      id: 'scorecard-v1',
      moduleId: 'vendor-risk',
      type: 'vendor-scorecard' as const,
      title: 'Scorecard v1',
      data: '# v1',
      createdAt: 1000,
    }
    const doc2 = {
      id: 'scorecard-v2',
      moduleId: 'vendor-risk',
      type: 'vendor-scorecard' as const,
      title: 'Scorecard v2',
      data: '# v2',
      createdAt: 2000,
    }
    useModuleStore.getState().addExecutiveDocument(doc1)
    useModuleStore.getState().addExecutiveDocument(doc2)
    const docs = useModuleStore.getState().artifacts.executiveDocuments ?? []
    // Should replace, not append — only 1 doc with the latest data
    expect(docs).toHaveLength(1)
    expect(docs[0].title).toBe('Scorecard v2')
    expect(docs[0].id).toBe('scorecard-v2')
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

  it('markAllLearnSectionsComplete marks all sections and sets status to completed', () => {
    useModuleStore.getState().markAllLearnSectionsComplete('pqc-101')
    const mod = useModuleStore.getState().modules['pqc-101']
    expect(mod.status).toBe('completed')
    expect(mod.learnSectionChecks!['quantum-threat']).toBe(true)
    expect(mod.learnSectionChecks!['algorithms']).toBe(true)
    expect(mod.learnSectionChecks!['timeline']).toBe(true)
    expect(mod.learnSectionChecks!['readiness']).toBe(true)
    expect(mod.learnSectionChecks!['next-steps']).toBe(true)
    expect(analytics.logModuleComplete).toHaveBeenCalledWith('pqc-101')
  })

  it('markAllLearnSectionsComplete is a no-op for unknown modules (no LEARN_SECTIONS)', () => {
    useModuleStore.getState().markAllLearnSectionsComplete('no-such-module')
    // state should be unchanged — no entry created
    expect(useModuleStore.getState().modules['no-such-module']).toBeUndefined()
    expect(analytics.logModuleComplete).not.toHaveBeenCalled()
  })
})
