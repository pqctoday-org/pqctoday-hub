// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import {
  buildExecutiveSummaryDefault,
  buildRiskOverviewDefault,
  buildQuantumUrgencyDefault,
  buildCryptoInventoryDefault,
  buildCategoryDriversDefault,
  buildAlgorithmMigrationsDefault,
  buildMigrationEffortDefault,
  buildTimelineDefault,
  buildCostBenefitDefault,
  buildBudgetDefault,
  buildGovernanceDefault,
  buildPeerBenchmarkDefault,
  buildRecommendedActionsDefault,
  buildPitchObjective,
  personaLabel,
} from './sectionDefaults'

function makeData(overrides: Partial<ExecutiveModuleData> = {}): ExecutiveModuleData {
  return {
    threatsByIndustry: new Map(),
    criticalThreatCount: 12,
    totalThreatCount: 40,
    industryThreats: [],
    vendorsByLayer: new Map(),
    fipsValidatedCount: 4,
    pqcReadyCount: 6,
    vendorReadinessWeighted: 0.15,
    vendorReadinessByLayer: new Map(),
    totalProducts: 42,
    frameworks: [],
    frameworksByIndustry: [],
    countryDeadlines: [],
    userCountryData: null,
    assessmentResult: null,
    riskScore: null,
    industry: 'Financial Services',
    country: 'United States',
    complianceSelections: [],
    preBoostScore: null,
    boosts: [],
    hndlRiskWindow: null,
    hnflRiskWindow: null,
    categoryScores: null,
    categoryDrivers: null,
    migrationEffort: [],
    algorithmMigrations: [],
    keyFindings: [],
    assessmentProfile: null,
    isAssessmentComplete: false,
    migrationDeadlineYear: null,
    ...overrides,
  }
}

describe('personaLabel', () => {
  it('returns readable labels for each persona', () => {
    expect(personaLabel('executive')).toMatch(/Executive/)
    expect(personaLabel('developer')).toBe('Developer')
    expect(personaLabel('architect')).toBe('Architect')
    expect(personaLabel('ops')).toMatch(/Operations/)
    expect(personaLabel(null)).toBe('Executive')
  })
})

describe('buildPitchObjective', () => {
  it('returns a distinct objective per supported persona', () => {
    const objs = new Set([
      buildPitchObjective('executive'),
      buildPitchObjective('developer'),
      buildPitchObjective('architect'),
      buildPitchObjective('ops'),
    ])
    expect(objs.size).toBe(4)
  })
})

describe('buildExecutiveSummaryDefault', () => {
  it('falls back to persona-specific copy when no assessment is present', () => {
    const data = makeData()
    expect(buildExecutiveSummaryDefault(data, 'executive')).toMatch(/business case|resilience/i)
    expect(buildExecutiveSummaryDefault(data, 'developer')).toMatch(
      /engineering|library|libraries/i
    )
    expect(buildExecutiveSummaryDefault(data, 'architect')).toMatch(/architecture|PKI|agility/i)
    expect(buildExecutiveSummaryDefault(data, 'ops')).toMatch(/runbook|rollout|service disruption/i)
  })

  it('uses personaNarrative when present', () => {
    const data = makeData({
      assessmentResult: {
        riskScore: 72,
        riskLevel: 'high',
        algorithmMigrations: [],
        complianceImpacts: [],
        recommendedActions: [],
        narrative: 'generic',
        generatedAt: '2026-04-18',
        personaNarrative: 'PERSONA NARRATIVE CUSTOM',
      },
      isAssessmentComplete: true,
      riskScore: 72,
    })
    expect(buildExecutiveSummaryDefault(data, 'executive')).toBe('PERSONA NARRATIVE CUSTOM')
  })
})

describe('buildRiskOverviewDefault', () => {
  it('surfaces preBoost delta and boost list', () => {
    const data = makeData({
      riskScore: 78,
      preBoostScore: 65,
      boosts: [
        { id: 'hndl-urgency', label: 'HNDL urgency', delta: 0.1 },
        { id: 'cnsa-regulatory', label: 'CNSA 2.0 pressure', delta: 0.05 },
      ],
      assessmentResult: {
        riskScore: 78,
        riskLevel: 'high',
        algorithmMigrations: [],
        complianceImpacts: [],
        recommendedActions: [],
        narrative: '',
        generatedAt: '',
      },
    })
    const out = buildRiskOverviewDefault(data)
    expect(out).toContain('78/100')
    expect(out).toContain('65/100')
    expect(out).toContain('HNDL urgency (+10%)')
    expect(out).toContain('CNSA 2.0 pressure (+5%)')
  })
})

describe('buildQuantumUrgencyDefault', () => {
  it('describes at-risk HNDL and HNFL windows', () => {
    const data = makeData({
      hndlRiskWindow: {
        dataRetentionYears: 25,
        estimatedQuantumThreatYear: 2035,
        currentYear: 2026,
        isAtRisk: true,
        riskWindowYears: 16,
      },
      hnflRiskWindow: {
        credentialLifetimeYears: 10,
        estimatedQuantumThreatYear: 2035,
        currentYear: 2026,
        isAtRisk: true,
        riskWindowYears: 1,
        hasSigningAlgorithms: true,
        hnflRelevantUseCases: ['Code signing'],
      },
    })
    const out = buildQuantumUrgencyDefault(data)
    expect(out).toMatch(/HNDL/)
    expect(out).toMatch(/HNFL/)
    expect(out).toContain('25-year')
    expect(out).toContain('Code signing')
  })

  it('falls back to educational copy when windows are absent', () => {
    const data = makeData()
    expect(buildQuantumUrgencyDefault(data)).toMatch(/HNDL.*HNFL|HNFL.*HNDL/s)
  })
})

describe('buildCryptoInventoryDefault', () => {
  it('summary excludes the per-layer breakdown, detail includes it', () => {
    const data = makeData({
      assessmentProfile: {
        industry: 'Finance',
        algorithmsSelected: ['RSA-2048', 'ECDSA P-256'],
        algorithmUnknown: false,
        sensitivityLevels: [],
        sensitivityUnknown: false,
        complianceFrameworks: [],
        complianceUnknown: false,
        migrationStatus: 'planning',
        migrationUnknown: false,
        mode: 'comprehensive',
        useCasesUnknown: false,
        retentionUnknown: false,
        credentialLifetimeUnknown: false,
        infrastructure: ['Cloud Storage', 'HSM / Hardware security modules'],
        infrastructureUnknown: false,
        infrastructureSubCategories: {
          'Cloud Storage': ['AWS KMS'],
          'HSM / Hardware security modules': ['Thales Luna'],
        },
        agilityUnknown: false,
        vendorUnknown: false,
        scaleUnknown: false,
        timelineUnknown: false,
      },
    })
    expect(buildCryptoInventoryDefault(data, 'summary')).not.toContain('AWS KMS')
    expect(buildCryptoInventoryDefault(data, 'detail')).toContain('AWS KMS')
    expect(buildCryptoInventoryDefault(data, 'detail')).toContain('Thales Luna')
  })
})

describe('buildCategoryDriversDefault', () => {
  it('renders all four category scores when present', () => {
    const data = makeData({
      categoryScores: {
        quantumExposure: 80,
        migrationComplexity: 55,
        regulatoryPressure: 90,
        organizationalReadiness: 40,
      },
      categoryDrivers: {
        quantumExposure: 'RSA in use with long retention.',
        migrationComplexity: 'Hardcoded crypto across microservices.',
        regulatoryPressure: 'CNSA 2.0 + NIS2 apply.',
        organizationalReadiness: 'Small crypto team.',
      },
    })
    const out = buildCategoryDriversDefault(data)
    expect(out).toContain('Quantum Exposure — 80/100')
    expect(out).toContain('Migration Complexity — 55/100')
    expect(out).toContain('Regulatory Pressure — 90/100')
    expect(out).toContain('Organizational Readiness — 40/100')
  })
})

describe('buildAlgorithmMigrationsDefault', () => {
  it('lists classical→PQC rows with urgency flags', () => {
    const data = makeData({
      algorithmMigrations: [
        {
          classical: 'RSA-2048',
          quantumVulnerable: true,
          replacement: 'ML-KEM-768',
          urgency: 'immediate',
          notes: 'Replace in TLS.',
        },
      ],
    })
    const out = buildAlgorithmMigrationsDefault(data)
    expect(out).toContain('RSA-2048 → ML-KEM-768')
    expect(out).toContain('immediate')
    expect(out).toContain('vulnerable')
  })
})

describe('buildMigrationEffortDefault', () => {
  it('produces a rollup and per-item lines', () => {
    const data = makeData({
      migrationEffort: [
        {
          algorithm: 'RSA-2048',
          complexity: 'high',
          estimatedScope: 'major-project',
          rationale: 'Spans TLS, PKI, and signing.',
        },
        {
          algorithm: 'SHA-256',
          complexity: 'low',
          estimatedScope: 'quick-win',
          rationale: 'Library bump only.',
        },
      ],
    })
    const out = buildMigrationEffortDefault(data)
    expect(out).toMatch(/1 quick-wins/)
    expect(out).toMatch(/1 major projects/)
    expect(out).toContain('RSA-2048')
    expect(out).toContain('SHA-256')
  })
})

describe('buildTimelineDefault', () => {
  it('returns distinct copy per persona when no deadline', () => {
    const data = makeData()
    const exec = buildTimelineDefault(data, 'executive')
    const dev = buildTimelineDefault(data, 'developer')
    const arch = buildTimelineDefault(data, 'architect')
    const ops = buildTimelineDefault(data, 'ops')
    expect(new Set([exec, dev, arch, ops]).size).toBe(4)
    expect(dev).toMatch(/Sprint/i)
    expect(arch).toMatch(/Architecture|Phase/)
    expect(ops).toMatch(/Canary|rollout/i)
  })

  it('references the deadline year when present', () => {
    const data = makeData({ migrationDeadlineYear: 2035 })
    expect(buildTimelineDefault(data, 'executive')).toContain('2035')
  })
})

describe('buildCostBenefitDefault and buildBudgetDefault', () => {
  it('cost-benefit tier scales with risk level', () => {
    const low = makeData({
      assessmentResult: {
        riskScore: 30,
        riskLevel: 'low',
        algorithmMigrations: [],
        complianceImpacts: [],
        recommendedActions: [],
        narrative: '',
        generatedAt: '',
      },
    })
    const critical = makeData({
      assessmentResult: {
        riskScore: 95,
        riskLevel: 'critical',
        algorithmMigrations: [],
        complianceImpacts: [],
        recommendedActions: [],
        narrative: '',
        generatedAt: '',
      },
    })
    expect(buildCostBenefitDefault(low)).toContain('moderate')
    expect(buildCostBenefitDefault(critical)).toContain('major')
    expect(buildBudgetDefault(low).amount).not.toBe(buildBudgetDefault(critical).amount)
  })
})

describe('buildGovernanceDefault', () => {
  it('returns different structures per persona', () => {
    const data = makeData()
    expect(buildGovernanceDefault(data, 'executive')).toMatch(/RACI|CISO/)
    expect(buildGovernanceDefault(data, 'architect')).toMatch(/Crypto Review Board|CRB/)
    expect(buildGovernanceDefault(data, 'ops')).toMatch(/On-call|runbook/i)
  })
})

describe('buildPeerBenchmarkDefault', () => {
  it('includes the industry and references frameworks when present', () => {
    const data = makeData({
      frameworksByIndustry: [
        {
          id: 'cnsa2',
          label: 'CNSA 2.0',
          description: '',
          industries: [],
          countries: [],
          requiresPQC: true,
          deadline: '2035',
          deadlinePhase: 'mid',
          notes: '',
          enforcementBody: '',
          libraryRefs: [],
          timelineRefs: [],
          bodyType: 'compliance_framework',
        },
      ],
    })
    const out = buildPeerBenchmarkDefault(data)
    expect(out).toContain('Financial Services')
    expect(out).toContain('CNSA 2.0')
  })
})

describe('buildRecommendedActionsDefault', () => {
  it('returns a fallback list when no assessment actions', () => {
    const out = buildRecommendedActionsDefault(makeData(), 'executive')
    expect(out).toContain('CBOM')
  })

  it('prefixes priority + category when actions are present', () => {
    const data = makeData({
      assessmentResult: {
        riskScore: 70,
        riskLevel: 'high',
        algorithmMigrations: [],
        complianceImpacts: [],
        recommendedActions: [
          {
            priority: 1,
            action: 'Start cryptographic inventory.',
            category: 'immediate',
            relatedModule: 'pqc-101',
          },
        ],
        narrative: '',
        generatedAt: '',
      },
    })
    const out = buildRecommendedActionsDefault(data, 'executive')
    expect(out).toMatch(/1\. \[IMMEDIATE\]/)
  })
})
