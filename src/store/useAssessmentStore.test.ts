// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAssessmentStore } from './useAssessmentStore'

// ── Dependency mocks ─────────────────────────────────────────────────────────

vi.mock('./usePersonaStore', () => ({
  usePersonaStore: {
    getState: vi.fn(() => ({ selectedPersona: null })),
  },
}))

vi.mock('./useHistoryStore', () => ({
  useHistoryStore: {
    getState: vi.fn(() => ({ addEvent: vi.fn() })),
  },
}))

const MOCK_DEFAULTS = {
  currentCrypto: ['RSA-2048'],
  currentCryptoCategories: ['Key Exchange'],
  dataSensitivity: ['medium'],
  complianceRequirements: ['HIPAA'],
  migrationStatus: 'planning' as const,
  cryptoUseCases: ['TLS/HTTPS'],
  dataRetention: ['5-10y'],
  credentialLifetime: ['3-10y'],
  cryptoAgility: 'partially-abstracted' as const,
  infrastructure: ['Cloud Storage'],
  vendorDependency: 'mixed' as const,
  timelinePressure: 'within-2-3y' as const,
}

vi.mock('../components/Assess/smartDefaults', () => ({
  computeSmartDefaults: vi.fn(() => MOCK_DEFAULTS),
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function resetStore() {
  useAssessmentStore.getState().reset()
  useAssessmentStore.setState({ assessmentHistory: [], previousRiskScore: null })
}

// ── Test suites ──────────────────────────────────────────────────────────────

describe('useAssessmentStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  // ── Initial state ──

  it('starts with sensible defaults', () => {
    const s = useAssessmentStore.getState()
    expect(s.industry).toBe('')
    expect(s.country).toBe('')
    expect(s.currentCrypto).toEqual([])
    expect(s.dataSensitivity).toEqual([])
    expect(s.complianceRequirements).toEqual([])
    expect(s.migrationStatus).toBe('')
    expect(s.assessmentStatus).toBe('not-started')
    expect(s.currentStep).toBe(0)
    expect(s.assessmentMode).toBeNull()
    expect(s.lastResult).toBeNull()
    expect(s.lastWizardUpdate).toBeNull()
  })

  // ── setStep ──

  it('setStep advances currentStep and stamps lastWizardUpdate', () => {
    const store = useAssessmentStore.getState()
    store.setStep(3)
    const { currentStep, lastWizardUpdate } = useAssessmentStore.getState()
    expect(currentStep).toBe(3)
    expect(lastWizardUpdate).not.toBeNull()
  })

  // ── setAssessmentMode ──

  it('setAssessmentMode transitions status to in-progress', () => {
    useAssessmentStore.getState().setAssessmentMode('comprehensive')
    const { assessmentMode, assessmentStatus } = useAssessmentStore.getState()
    expect(assessmentMode).toBe('comprehensive')
    expect(assessmentStatus).toBe('in-progress')
  })

  it('setAssessmentMode accepts quick mode', () => {
    useAssessmentStore.getState().setAssessmentMode('quick')
    expect(useAssessmentStore.getState().assessmentMode).toBe('quick')
  })

  // ── setIndustry / setCountry ──

  it('setIndustry clears compliance requirements', () => {
    const store = useAssessmentStore.getState()
    store.setComplianceRequirements(['HIPAA', 'GDPR'])
    store.setIndustry('Finance & Banking')
    const { industry, complianceRequirements } = useAssessmentStore.getState()
    expect(industry).toBe('Finance & Banking')
    expect(complianceRequirements).toEqual([])
  })

  it('setCountry clears compliance requirements', () => {
    const store = useAssessmentStore.getState()
    store.setComplianceRequirements(['CNSA 2.0'])
    store.setCountry('United States')
    const { country, complianceRequirements } = useAssessmentStore.getState()
    expect(country).toBe('United States')
    expect(complianceRequirements).toEqual([])
  })

  // ── toggleCrypto ──

  it('toggleCrypto adds algorithm on first call', () => {
    useAssessmentStore.getState().toggleCrypto('RSA-2048')
    expect(useAssessmentStore.getState().currentCrypto).toContain('RSA-2048')
  })

  it('toggleCrypto removes algorithm on second call (toggle off)', () => {
    const store = useAssessmentStore.getState()
    store.toggleCrypto('RSA-2048')
    store.toggleCrypto('RSA-2048')
    expect(useAssessmentStore.getState().currentCrypto).not.toContain('RSA-2048')
  })

  it('toggleCrypto clears cryptoUnknown flag', () => {
    useAssessmentStore.setState({ cryptoUnknown: true })
    useAssessmentStore.getState().toggleCrypto('AES-256')
    expect(useAssessmentStore.getState().cryptoUnknown).toBe(false)
  })

  // ── setCryptoUnknown ──

  it('setCryptoUnknown(true) populates smart defaults', () => {
    useAssessmentStore.getState().setCryptoUnknown(true)
    const { cryptoUnknown, currentCrypto } = useAssessmentStore.getState()
    expect(cryptoUnknown).toBe(true)
    expect(currentCrypto).toEqual(MOCK_DEFAULTS.currentCrypto)
  })

  it('setCryptoUnknown(false) clears crypto selection', () => {
    useAssessmentStore.setState({ currentCrypto: ['RSA-2048'], cryptoUnknown: true })
    useAssessmentStore.getState().setCryptoUnknown(false)
    const { cryptoUnknown, currentCrypto } = useAssessmentStore.getState()
    expect(cryptoUnknown).toBe(false)
    expect(currentCrypto).toEqual([])
  })

  // ── toggleDataSensitivity ──

  it('toggleDataSensitivity supports multi-select', () => {
    const store = useAssessmentStore.getState()
    store.toggleDataSensitivity('high')
    store.toggleDataSensitivity('critical')
    expect(useAssessmentStore.getState().dataSensitivity).toEqual(['high', 'critical'])
  })

  it('toggleDataSensitivity removes on second toggle and clears sensitivityUnknown', () => {
    useAssessmentStore.setState({ sensitivityUnknown: true })
    const store = useAssessmentStore.getState()
    store.toggleDataSensitivity('medium')
    store.toggleDataSensitivity('medium')
    const state = useAssessmentStore.getState()
    expect(state.dataSensitivity).not.toContain('medium')
    expect(state.sensitivityUnknown).toBe(false)
  })

  // ── setSensitivityUnknown ──

  it('setSensitivityUnknown(true) applies smart defaults', () => {
    useAssessmentStore.getState().setSensitivityUnknown(true)
    const { sensitivityUnknown, dataSensitivity } = useAssessmentStore.getState()
    expect(sensitivityUnknown).toBe(true)
    expect(dataSensitivity).toEqual(MOCK_DEFAULTS.dataSensitivity)
  })

  // ── toggleCompliance / setComplianceRequirements ──

  it('toggleCompliance adds framework', () => {
    useAssessmentStore.getState().toggleCompliance('HIPAA')
    expect(useAssessmentStore.getState().complianceRequirements).toContain('HIPAA')
  })

  it('setComplianceRequirements replaces entire list', () => {
    const store = useAssessmentStore.getState()
    store.toggleCompliance('HIPAA')
    store.setComplianceRequirements(['CNSA 2.0', 'FIPS 140-3'])
    expect(useAssessmentStore.getState().complianceRequirements).toEqual(['CNSA 2.0', 'FIPS 140-3'])
  })

  // ── toggleDataRetention ──

  it('toggleDataRetention supports multi-select', () => {
    const store = useAssessmentStore.getState()
    store.toggleDataRetention('5-10y')
    store.toggleDataRetention('10-25y')
    expect(useAssessmentStore.getState().dataRetention).toEqual(['5-10y', '10-25y'])
  })

  // ── toggleCredentialLifetime ──

  it('toggleCredentialLifetime adds and removes values', () => {
    const store = useAssessmentStore.getState()
    store.toggleCredentialLifetime('3-10y')
    expect(useAssessmentStore.getState().credentialLifetime).toContain('3-10y')
    store.toggleCredentialLifetime('3-10y')
    expect(useAssessmentStore.getState().credentialLifetime).not.toContain('3-10y')
  })

  // ── toggleInfrastructure ──

  it('toggleInfrastructure adds item', () => {
    useAssessmentStore.getState().toggleInfrastructure('Cloud Storage')
    expect(useAssessmentStore.getState().infrastructure).toContain('Cloud Storage')
  })

  it('toggleInfrastructure removes item and its subCategories', () => {
    const store = useAssessmentStore.getState()
    store.toggleInfrastructure('Cloud Storage')
    store.setInfrastructureSubCategory('Cloud Storage', ['AWS KMS'])
    store.toggleInfrastructure('Cloud Storage')
    const state = useAssessmentStore.getState()
    expect(state.infrastructure).not.toContain('Cloud Storage')
    expect(state.infrastructureSubCategories['Cloud Storage']).toBeUndefined()
  })

  // ── setInfrastructureSubCategory ──

  it('setInfrastructureSubCategory stores per-layer sub-categories', () => {
    useAssessmentStore
      .getState()
      .setInfrastructureSubCategory('Cloud Storage', ['AWS KMS', 'Azure Key Vault'])
    expect(useAssessmentStore.getState().infrastructureSubCategories['Cloud Storage']).toEqual([
      'AWS KMS',
      'Azure Key Vault',
    ])
  })

  // ── hideThreat / restoreThreat ──

  it('hideThreat adds threatId and restoreThreat removes it', () => {
    const store = useAssessmentStore.getState()
    store.hideThreat('threat-123')
    expect(useAssessmentStore.getState().hiddenThreats).toContain('threat-123')
    store.restoreThreat('threat-123')
    expect(useAssessmentStore.getState().hiddenThreats).not.toContain('threat-123')
  })

  it('hideThreat is idempotent — no duplicate entries', () => {
    const store = useAssessmentStore.getState()
    store.hideThreat('threat-abc')
    store.hideThreat('threat-abc')
    expect(
      useAssessmentStore.getState().hiddenThreats.filter((id) => id === 'threat-abc')
    ).toHaveLength(1)
  })

  it('restoreAllThreats empties hiddenThreats', () => {
    const store = useAssessmentStore.getState()
    store.hideThreat('a')
    store.hideThreat('b')
    store.restoreAllThreats()
    expect(useAssessmentStore.getState().hiddenThreats).toEqual([])
  })

  // ── markComplete ──

  it('markComplete transitions status to complete and sets completedAt', () => {
    useAssessmentStore.getState().markComplete()
    const { assessmentStatus, completedAt } = useAssessmentStore.getState()
    expect(assessmentStatus).toBe('complete')
    expect(completedAt).not.toBeNull()
  })

  it('markComplete preserves original completedAt on repeated calls', () => {
    const store = useAssessmentStore.getState()
    store.markComplete()
    const first = useAssessmentStore.getState().completedAt
    store.markComplete()
    const second = useAssessmentStore.getState().completedAt
    expect(first).toBe(second)
  })

  // ── reset ──

  it('reset clears wizard state but preserves assessmentHistory', () => {
    const store = useAssessmentStore.getState()
    store.setIndustry('Finance')
    store.setStep(5)
    store.pushSnapshot({
      completedAt: '2026-01-01T00:00:00Z',
      riskScore: 75,
      categoryScores: {
        quantumExposure: 80,
        migrationComplexity: 70,
        regulatoryPressure: 75,
        organizationalReadiness: 65,
      },
      riskLevel: 'high',
      industry: 'Finance',
    })
    store.reset()
    const state = useAssessmentStore.getState()
    expect(state.industry).toBe('')
    expect(state.currentStep).toBe(0)
    expect(state.assessmentHistory).toHaveLength(1) // preserved
  })

  // ── editFromStep ──

  it('editFromStep sets status to in-progress and jumps to step', () => {
    useAssessmentStore.getState().editFromStep(7)
    const { assessmentStatus, currentStep } = useAssessmentStore.getState()
    expect(assessmentStatus).toBe('in-progress')
    expect(currentStep).toBe(7)
  })

  // ── pushSnapshot ──

  it('pushSnapshot stores snapshot', () => {
    useAssessmentStore.getState().pushSnapshot({
      completedAt: '2026-03-01T00:00:00Z',
      riskScore: 60,
      categoryScores: {
        quantumExposure: 65,
        migrationComplexity: 55,
        regulatoryPressure: 60,
        organizationalReadiness: 60,
      },
      riskLevel: 'medium',
      industry: 'Technology',
    })
    expect(useAssessmentStore.getState().assessmentHistory).toHaveLength(1)
  })

  it('pushSnapshot deduplicates by completedAt', () => {
    const snapshot = {
      completedAt: '2026-03-01T00:00:00Z',
      riskScore: 60,
      categoryScores: {
        quantumExposure: 65,
        migrationComplexity: 55,
        regulatoryPressure: 60,
        organizationalReadiness: 60,
      },
      riskLevel: 'medium' as const,
      industry: 'Technology',
    }
    useAssessmentStore.getState().pushSnapshot(snapshot)
    useAssessmentStore.getState().pushSnapshot(snapshot)
    expect(useAssessmentStore.getState().assessmentHistory).toHaveLength(1)
  })

  it('pushSnapshot caps history at 5 entries', () => {
    const store = useAssessmentStore.getState()
    for (let i = 0; i < 7; i++) {
      store.pushSnapshot({
        completedAt: `2026-0${i + 1}-01T00:00:00Z`,
        riskScore: i * 10,
        categoryScores: {
          quantumExposure: 50,
          migrationComplexity: 50,
          regulatoryPressure: 50,
          organizationalReadiness: 50,
        },
        riskLevel: 'medium',
        industry: 'Technology',
      })
    }
    expect(useAssessmentStore.getState().assessmentHistory).toHaveLength(5)
  })

  // ── getInput ──

  it('getInput returns null when required fields are missing', () => {
    expect(useAssessmentStore.getState().getInput()).toBeNull()
  })

  it('getInput returns null when dataSensitivity is empty and not unknown', () => {
    useAssessmentStore.setState({
      industry: 'Technology',
      dataSensitivity: [],
      sensitivityUnknown: false,
      migrationStatus: 'planning',
    })
    expect(useAssessmentStore.getState().getInput()).toBeNull()
  })

  it('getInput returns valid AssessmentInput when all required fields set', () => {
    useAssessmentStore.setState({
      industry: 'Technology',
      dataSensitivity: ['medium'],
      migrationStatus: 'planning',
      currentCrypto: ['RSA-2048'],
      complianceRequirements: ['HIPAA'],
    })
    const input = useAssessmentStore.getState().getInput()
    expect(input).not.toBeNull()
    expect(input?.industry).toBe('Technology')
    expect(input?.dataSensitivity).toEqual(['medium'])
    expect(input?.migrationStatus).toBe('planning')
  })

  it('getInput includes optional extended fields when set', () => {
    useAssessmentStore.setState({
      industry: 'Technology',
      dataSensitivity: ['high'],
      migrationStatus: 'not-started',
      currentCrypto: ['RSA-2048'],
      complianceRequirements: [],
      country: 'United States',
      systemCount: '11-50',
      teamSize: '1-10',
      cryptoAgility: 'hardcoded',
      credentialLifetime: ['3-10y'],
      vendorDependency: 'heavy-vendor',
      timelinePressure: 'within-1y',
    })
    const input = useAssessmentStore.getState().getInput()
    expect(input?.country).toBe('United States')
    expect(input?.systemCount).toBe('11-50')
    expect(input?.cryptoAgility).toBe('hardcoded')
    expect(input?.credentialLifetime).toEqual(['3-10y'])
    expect(input?.vendorDependency).toBe('heavy-vendor')
    expect(input?.timelinePressure).toBe('within-1y')
  })

  it('getInput passes sensitivityUnknown flag through', () => {
    useAssessmentStore.setState({
      industry: 'Technology',
      dataSensitivity: ['medium'],
      sensitivityUnknown: true,
      migrationStatus: 'planning',
      currentCrypto: [],
    })
    const input = useAssessmentStore.getState().getInput()
    expect(input?.sensitivityUnknown).toBe(true)
  })

  it('getInput includes infrastructureSubCategories when non-empty', () => {
    useAssessmentStore.setState({
      industry: 'Technology',
      dataSensitivity: ['medium'],
      migrationStatus: 'planning',
      currentCrypto: ['RSA-2048'],
      complianceRequirements: [],
      infrastructure: ['Cloud Storage'],
      infrastructureSubCategories: { 'Cloud Storage': ['AWS KMS'] },
    })
    const input = useAssessmentStore.getState().getInput()
    expect(input?.infrastructureSubCategories).toEqual({ 'Cloud Storage': ['AWS KMS'] })
  })

  // ── setMigrationStatus ──

  it('setMigrationStatus clears migrationUnknown', () => {
    useAssessmentStore.setState({ migrationUnknown: true })
    useAssessmentStore.getState().setMigrationStatus('started')
    const { migrationStatus, migrationUnknown } = useAssessmentStore.getState()
    expect(migrationStatus).toBe('started')
    expect(migrationUnknown).toBe(false)
  })

  // ── setCryptoAgility ──

  it('setCryptoAgility clears agilityUnknown', () => {
    useAssessmentStore.setState({ agilityUnknown: true })
    useAssessmentStore.getState().setCryptoAgility('fully-abstracted')
    expect(useAssessmentStore.getState().agilityUnknown).toBe(false)
    expect(useAssessmentStore.getState().cryptoAgility).toBe('fully-abstracted')
  })

  // ── Migration compatibility ──

  it('migrate v1→v2: converts string dataSensitivity to array', () => {
    // Access the migrate function via the persist config by rehydrating old state
    const persistApi = useAssessmentStore.persist as {
      getOptions: () => { migrate?: (state: unknown, version: number) => unknown }
    }
    const migrate = persistApi.getOptions().migrate
    if (!migrate) return

    const result = migrate({ dataSensitivity: 'high', dataRetention: '5-10y' }, 1) as Record<
      string,
      unknown
    >
    expect(Array.isArray(result.dataSensitivity)).toBe(true)
    expect(result.dataSensitivity).toContain('high')
    expect(Array.isArray(result.dataRetention)).toBe(true)
    expect(result.dataRetention).toContain('5-10y')
  })

  it('migrate v2→v3: converts isComplete=true to assessmentStatus=complete', () => {
    const persistApi = useAssessmentStore.persist as {
      getOptions: () => { migrate?: (state: unknown, version: number) => unknown }
    }
    const migrate = persistApi.getOptions().migrate
    if (!migrate) return

    const result = migrate(
      { isComplete: true, dataSensitivity: [], dataRetention: [] },
      2
    ) as Record<string, unknown>
    expect(result.assessmentStatus).toBe('complete')
  })

  it('migrate v9→v10: migrationStatus "unknown" → migrationUnknown=true', () => {
    const persistApi = useAssessmentStore.persist as {
      getOptions: () => { migrate?: (state: unknown, version: number) => unknown }
    }
    const migrate = persistApi.getOptions().migrate
    if (!migrate) return

    const result = migrate(
      { migrationStatus: 'unknown', cryptoAgility: 'unknown', timelinePressure: 'unknown' },
      9
    ) as Record<string, unknown>
    expect(result.migrationUnknown).toBe(true)
    expect(result.migrationStatus).toBe('not-started')
    expect(result.agilityUnknown).toBe(true)
    expect(result.cryptoAgility).toBe('partially-abstracted')
    expect(result.timelineUnknown).toBe(true)
    expect(result.timelinePressure).toBe('no-deadline')
  })
})
