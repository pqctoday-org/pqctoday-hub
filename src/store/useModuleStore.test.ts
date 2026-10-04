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
  beforeEach(() => {
    vi.clearAllMocks()
    useModuleStore.getState().resetProgress()
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

  it('a module mount does NOT downgrade a completed module to in-progress (revisit guard)', () => {
    const store = useModuleStore.getState()
    store.updateModuleProgress('module-1', { status: 'completed' })
    expect(useModuleStore.getState().modules['module-1'].status).toBe('completed')
    // simulate revisit: the mount effect fires { status: 'in-progress', lastVisited }
    store.updateModuleProgress('module-1', { status: 'in-progress', lastVisited: Date.now() })
    expect(useModuleStore.getState().modules['module-1'].status).toBe('completed')
  })

  it('an explicit Reset (clears completedSteps) still downgrades a completed module', () => {
    const store = useModuleStore.getState()
    store.updateModuleProgress('module-1', { status: 'completed' })
    // the Reset action sends completedSteps:[] + timeSpent:0 alongside in-progress
    store.updateModuleProgress('module-1', {
      status: 'in-progress',
      completedSteps: [],
      timeSpent: 0,
    })
    expect(useModuleStore.getState().modules['module-1'].status).toBe('in-progress')
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

  it('loads progress AND migrates it through the version ladder (no stale shapes)', () => {
    // A v2 backup must be UPGRADED to the current data version on import — not
    // imported as-is (the old data-loss behaviour, where an old backup kept
    // partial/stale shapes because loadProgress bypassed the migrate ladder).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock
    const customProgress = { version: '2.0.0', preferences: { theme: 'light' } } as any
    useModuleStore.getState().loadProgress(customProgress)
    expect(useModuleStore.getState().version).toBe('19.0.0') // migrated to current
    expect(useModuleStore.getState().preferences.theme).toBe('light') // value preserved
  })

  it('runs the v5→v6 key-management split when importing an old backup', () => {
    // The concrete data-loss case: a pre-v6 backup still carrying the retired
    // `key-management` id. Import must split it into kms-pqc / hsm-pqc (via the
    // migrate ladder) instead of stranding that progress under a dead id.
    const oldBackup = {
      version: '5.0.0',
      modules: {
        'key-management': {
          status: 'completed',
          lastVisited: 1,
          timeSpent: 42,
          completedSteps: ['intro'],
          quizScores: { q1: 80 },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- partial backup mock
    } as any
    useModuleStore.getState().loadProgress(oldBackup)
    const mods = useModuleStore.getState().modules
    expect(mods['key-management']).toBeUndefined()
    expect(mods['kms-pqc']).toBeDefined()
    expect(mods['kms-pqc'].timeSpent).toBe(42)
    expect(mods['hsm-pqc']).toBeDefined()
    expect(useModuleStore.getState().version).toBe('19.0.0')
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
    expect((progress as any).loadProgress).toBeUndefined()
    expect(progress.version).toBe('1.0.0')
  })

  it('migrates from version 0 to current (7), initializing all fields', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
    const migrate = (useModuleStore.persist.getOptions() as any).migrate
    const v0State = { timestamp: 123 }
    const migrated = migrate(v0State, 0)
    expect(migrated.version).toBe('19.0.0')
    expect(migrated.artifacts).toBeDefined()
    expect(migrated.artifacts.executiveDocuments).toEqual([])
    expect(migrated.sessionTracking).toBeDefined()
    expect(migrated.quizMastery).toBeDefined()
    expect(migrated.quizMastery.correctQuestionIds).toEqual([])
    expect(migrated.timestamp).toEqual(expect.any(Number))
  })

  describe('v18 → v19: FHE content moved from confidential-computing to homomorphic-encryption', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
    const migrate = () => (useModuleStore.persist.getOptions() as any).migrate

    const v18 = (cc: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
      version: '18.0.0',
      modules: { 'confidential-computing': cc, ...extra },
      artifacts: { keys: [], certificates: [], csrs: [], executiveDocuments: [] },
    })
    const TEE_STEPS = [
      'tee-architecture-explorer',
      'attestation-workshop',
      'encryption-mechanisms',
      'tee-hsm-channel',
      'quantum-threat-migration',
    ]
    const TEE_SECTIONS = [
      'tee-fundamentals',
      'vendor-architectures',
      'attestation',
      'memory-encryption',
      'tee-hsm',
      'quantum-threats',
    ]

    it('moves the FHE step and the read FHE section to the new module, keeping TEE progress', () => {
      const migrated = migrate()(
        v18({
          status: 'in-progress',
          lastVisited: 11,
          timeSpent: 40,
          completedSteps: [TEE_STEPS[0], 'fhe-hsm-flows'],
          quizScores: { q1: 80 },
          learnSectionChecks: { 'tee-fundamentals': true, 'homomorphic-encryption': true },
        }),
        18
      )
      expect(migrated.version).toBe('19.0.0')
      const cc = migrated.modules['confidential-computing']
      expect(cc.completedSteps).toEqual([TEE_STEPS[0]])
      expect(cc.learnSectionChecks).toEqual({ 'tee-fundamentals': true })
      expect(cc.timeSpent).toBe(40)
      expect(cc.quizScores).toEqual({ q1: 80 })
      expect(cc.status).toBe('in-progress')
      const fhe = migrated.modules['homomorphic-encryption']
      expect(fhe.completedSteps).toEqual(['fhe-hsm-flows'])
      expect(Object.keys(fhe.learnSectionChecks).sort()).toEqual([
        'fhe-fundamentals',
        'fhe-hsm-custody',
        'fhe-implementations',
        'fhe-keys-operations',
        'fhe-quantum',
      ])
      // Its one workshop step and all five sections are done, so it counts as complete.
      expect(fhe.status).toBe('completed')
      expect(fhe.timeSpent).toBe(0)
      expect(fhe.lastVisited).toBe(11)
    })

    it('leaves a module with only the FHE step done in progress', () => {
      const migrated = migrate()(
        v18({
          status: 'in-progress',
          lastVisited: 11,
          timeSpent: 5,
          completedSteps: ['fhe-hsm-flows'],
          quizScores: {},
        }),
        18
      )
      const fhe = migrated.modules['homomorphic-encryption']
      expect(fhe.completedSteps).toEqual(['fhe-hsm-flows'])
      // the single required workshop step is done, so the store's own rule completes it
      expect(fhe.status).toBe('completed')
    })

    it('completes the TEE module once when steps 1-5 were done but the FHE step was not', () => {
      const migrated = migrate()(
        v18({
          status: 'in-progress',
          lastVisited: 3,
          timeSpent: 90,
          completedSteps: TEE_STEPS,
          quizScores: {},
        }),
        18
      )
      expect(migrated.modules['confidential-computing'].status).toBe('completed')
      expect(migrated.modules['homomorphic-encryption']).toBeUndefined()
    })

    it('never demotes a completed TEE module and does not invent FHE progress for it', () => {
      const migrated = migrate()(
        v18({
          status: 'completed',
          lastVisited: 3,
          timeSpent: 120,
          completedSteps: [...TEE_STEPS, 'fhe-hsm-flows'],
          quizScores: {},
          learnSectionChecks: Object.fromEntries(
            [...TEE_SECTIONS, 'homomorphic-encryption'].map((id) => [id, true])
          ),
        }),
        18
      )
      const cc = migrated.modules['confidential-computing']
      expect(cc.status).toBe('completed')
      expect(cc.completedSteps).toEqual(TEE_STEPS)
      expect(Object.keys(cc.learnSectionChecks)).toEqual(TEE_SECTIONS)
    })

    it('merges into an existing homomorphic-encryption entry without losing either side', () => {
      const migrated = migrate()(
        v18(
          {
            status: 'in-progress',
            lastVisited: 5,
            timeSpent: 10,
            completedSteps: ['fhe-hsm-flows'],
            quizScores: {},
          },
          {
            'homomorphic-encryption': {
              status: 'in-progress',
              lastVisited: 9,
              timeSpent: 7,
              completedSteps: [],
              quizScores: { q: 1 },
              learnSectionChecks: { 'fhe-quantum': true },
            },
          }
        ),
        18
      )
      const fhe = migrated.modules['homomorphic-encryption']
      expect(fhe.lastVisited).toBe(9)
      expect(fhe.timeSpent).toBe(7)
      expect(fhe.quizScores).toEqual({ q: 1 })
      expect(fhe.completedSteps).toEqual(['fhe-hsm-flows'])
      expect(fhe.learnSectionChecks['fhe-quantum']).toBe(true)
    })

    it('does nothing for a learner with no confidential-computing progress', () => {
      const migrated = migrate()(
        {
          version: '18.0.0',
          modules: {},
          artifacts: { keys: [], certificates: [], csrs: [], executiveDocuments: [] },
        },
        18
      )
      expect(migrated.modules['confidential-computing']).toBeUndefined()
      expect(migrated.modules['homomorphic-encryption']).toBeUndefined()
    })

    it('is idempotent: migrating the result again changes nothing', () => {
      const once = migrate()(
        v18({
          status: 'in-progress',
          lastVisited: 11,
          timeSpent: 40,
          completedSteps: [TEE_STEPS[0], 'fhe-hsm-flows'],
          quizScores: {},
          learnSectionChecks: { 'homomorphic-encryption': true },
        }),
        18
      )
      const twice = migrate()(JSON.parse(JSON.stringify(once)), 19)
      expect(twice.modules).toEqual(once.modules)
    })
  })

  it('v17 → v18 carries iot-ot-pqc progress to iot-pqc and energy-utilities-pqc to ot-pqc', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
    const migrate = (useModuleStore.persist.getOptions() as any).migrate
    const v17State = {
      version: '17.0.0',
      modules: {
        'iot-ot-pqc': {
          status: 'in-progress',
          lastVisited: 7,
          timeSpent: 20,
          completedSteps: ['firmware-signing'],
          quizScores: {},
        },
        'energy-utilities-pqc': {
          status: 'completed',
          lastVisited: 9,
          timeSpent: 45,
          completedSteps: ['substation-migration-planner'],
          quizScores: {},
        },
      },
      artifacts: { keys: [], certificates: [], csrs: [], executiveDocuments: [] },
    }
    const migrated = migrate(v17State, 17)
    expect(migrated.version).toBe('19.0.0')
    expect(migrated.modules['iot-ot-pqc']).toBeUndefined()
    expect(migrated.modules['energy-utilities-pqc']).toBeUndefined()
    expect(migrated.modules['iot-pqc'].completedSteps).toEqual(['firmware-signing'])
    expect(migrated.modules['iot-pqc'].timeSpent).toBe(20)
    expect(migrated.modules['ot-pqc'].status).toBe('completed')
    expect(migrated.modules['ot-pqc'].completedSteps).toEqual(['substation-migration-planner'])
  })

  it('v16 → v17 carries fips-pci-certification progress to fips-140-3-certification', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing internal persist options
    const migrate = (useModuleStore.persist.getOptions() as any).migrate
    const v16State = {
      version: '16.0.0',
      modules: {
        'fips-pci-certification': {
          status: 'in-progress',
          lastVisited: 5,
          timeSpent: 12,
          completedSteps: ['fips-level-planner'],
          quizScores: {},
        },
      },
      artifacts: { keys: [], certificates: [], csrs: [], executiveDocuments: [] },
    }
    const migrated = migrate(v16State, 16)
    expect(migrated.version).toBe('19.0.0')
    expect(migrated.modules['fips-pci-certification']).toBeUndefined()
    expect(migrated.modules['fips-140-3-certification'].completedSteps).toEqual([
      'fips-level-planner',
    ])
    expect(migrated.modules['fips-140-3-certification'].timeSpent).toBe(12)
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
    expect(migrated.version).toBe('19.0.0')
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
    expect(migrated.version).toBe('19.0.0')
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
    expect(migrated.version).toBe('19.0.0')
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
    expect(migrated.version).toBe('19.0.0')
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
    expect(migrated.version).toBe('19.0.0')
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
