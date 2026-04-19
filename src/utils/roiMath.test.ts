// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_COMPLIANCE_INCIDENT_RATE,
  DEFAULT_MANDATED_PENALTY_FALLBACK,
  MIGRATION_COST_FLOOR,
  breachProbabilityFromRiskScore,
  composeQuantumMultiplier,
  computeAnnualBreachSavings,
  computeAnnualComplianceSavings,
  computeMigrationCostFromProfile,
  computeROI,
  resolveIndustryBreachBaseline,
  selectCompliancePenalty,
} from './roiMath'
import type { AssessmentResult, AssessmentProfile } from '@/hooks/assessmentTypes'

// ── resolveIndustryBreachBaseline ────────────────────────────────────────

describe('resolveIndustryBreachBaseline', () => {
  it('returns the known baseline for Healthcare', () => {
    expect(resolveIndustryBreachBaseline('Healthcare')).toBe(9_770_000)
  })

  it('falls back to Other for an unknown industry', () => {
    expect(resolveIndustryBreachBaseline('Blockchain Ponies')).toBe(4_880_000)
  })

  it('falls back to Other when industry is undefined', () => {
    expect(resolveIndustryBreachBaseline(undefined)).toBe(4_880_000)
  })
})

// ── computeAnnualBreachSavings ───────────────────────────────────────────

describe('computeAnnualBreachSavings', () => {
  it('computes baseline × probability with implicit multiplier = 1', () => {
    const result = computeAnnualBreachSavings({
      breachBaseline: 10_000_000,
      breachProbabilityPct: 10,
    })
    expect(result).toBe(1_000_000)
  })

  it('applies the quantum multiplier when provided', () => {
    const result = computeAnnualBreachSavings({
      breachBaseline: 10_000_000,
      breachProbabilityPct: 10,
      quantumMultiplier: 2.5,
    })
    expect(result).toBe(2_500_000)
  })

  it('returns 0 when probability is 0', () => {
    expect(
      computeAnnualBreachSavings({ breachBaseline: 10_000_000, breachProbabilityPct: 0 })
    ).toBe(0)
  })
})

// ── computeAnnualComplianceSavings ───────────────────────────────────────

describe('computeAnnualComplianceSavings', () => {
  it('uses the default 10% incident rate when none provided', () => {
    const result = computeAnnualComplianceSavings({
      frameworkCount: 3,
      penaltyPerIncident: 2_000_000,
    })
    expect(result).toBeCloseTo(600_000)
    expect(DEFAULT_COMPLIANCE_INCIDENT_RATE).toBe(0.1)
  })

  it('respects a custom incident rate', () => {
    const result = computeAnnualComplianceSavings({
      frameworkCount: 3,
      penaltyPerIncident: 2_000_000,
      incidentRate: 0.05,
    })
    expect(result).toBe(300_000)
  })

  it('returns 0 when no frameworks apply', () => {
    const result = computeAnnualComplianceSavings({
      frameworkCount: 0,
      penaltyPerIncident: 2_000_000,
    })
    expect(result).toBe(0)
  })
})

// ── computeROI ───────────────────────────────────────────────────────────

describe('computeROI', () => {
  it('computes totalBenefit as annualBenefit × horizon', () => {
    const r = computeROI({ migrationCost: 1_000_000, annualBenefit: 500_000, horizonYears: 3 })
    expect(r.totalBenefit).toBe(1_500_000)
  })

  it('computes payback from the annual benefit (not the horizon total)', () => {
    // 1M cost / 500K/yr = 2 years = 24 months, regardless of horizon
    const r1 = computeROI({ migrationCost: 1_000_000, annualBenefit: 500_000, horizonYears: 1 })
    const r3 = computeROI({ migrationCost: 1_000_000, annualBenefit: 500_000, horizonYears: 3 })
    const r5 = computeROI({ migrationCost: 1_000_000, annualBenefit: 500_000, horizonYears: 5 })
    expect(r1.paybackMonths).toBe(24)
    expect(r3.paybackMonths).toBe(24)
    expect(r5.paybackMonths).toBe(24)
  })

  it('yields positive ROI% when totalBenefit exceeds migrationCost', () => {
    const r = computeROI({ migrationCost: 1_000_000, annualBenefit: 500_000, horizonYears: 3 })
    // (1.5M - 1M) / 1M × 100 = 50
    expect(r.roiPercent).toBe(50)
  })

  it('yields 0% ROI at break-even', () => {
    const r = computeROI({ migrationCost: 1_000_000, annualBenefit: 500_000, horizonYears: 2 })
    expect(r.roiPercent).toBe(0)
  })

  it('yields negative ROI% when benefit is below cost', () => {
    const r = computeROI({ migrationCost: 1_000_000, annualBenefit: 200_000, horizonYears: 3 })
    // (600K - 1M) / 1M × 100 = -40
    expect(r.roiPercent).toBe(-40)
  })

  it('returns Infinity payback when annualBenefit <= 0', () => {
    const r = computeROI({ migrationCost: 1_000_000, annualBenefit: 0, horizonYears: 3 })
    expect(r.paybackMonths).toBe(Infinity)
  })

  it('returns 0% ROI when migrationCost is 0 (guards divide-by-zero)', () => {
    const r = computeROI({ migrationCost: 0, annualBenefit: 500_000, horizonYears: 3 })
    expect(r.roiPercent).toBe(0)
  })

  it('omits npv when no discountRate is provided', () => {
    const r = computeROI({ migrationCost: 1_000_000, annualBenefit: 500_000, horizonYears: 3 })
    expect(r.npv).toBeUndefined()
  })

  it('computes NPV using the discount rate (matches closed-form PV)', () => {
    const annualBenefit = 500_000
    const rate = 0.1
    const horizon = 3
    const migrationCost = 1_000_000
    // PV = 500K / 1.1 + 500K / 1.21 + 500K / 1.331 ≈ 1,243,425.99
    const expectedNpv =
      annualBenefit / 1.1 + annualBenefit / 1.21 + annualBenefit / 1.331 - migrationCost
    const r = computeROI({
      migrationCost,
      annualBenefit,
      horizonYears: horizon,
      discountRate: rate,
    })
    expect(r.npv).toBeCloseTo(expectedNpv, 2)
  })

  it('NPV with 0% discount rate equals undiscounted totalBenefit minus cost', () => {
    const r = computeROI({
      migrationCost: 1_000_000,
      annualBenefit: 500_000,
      horizonYears: 3,
      discountRate: 0,
    })
    expect(r.npv).toBeCloseTo(r.totalBenefit - 1_000_000, 6)
  })

  it('treats annualOpex = 0 identically to the pre-opex behavior', () => {
    const r = computeROI({ migrationCost: 1_000_000, annualBenefit: 500_000, horizonYears: 3 })
    expect(r.netAnnualBenefit).toBe(500_000)
    expect(r.totalCost).toBe(1_000_000)
    expect(r.paybackMonths).toBe(24)
  })

  it('adds annualOpex × horizon into totalCost and extends payback', () => {
    const r = computeROI({
      migrationCost: 1_000_000,
      annualOpex: 100_000,
      annualBenefit: 500_000,
      horizonYears: 3,
    })
    // totalCost = 1M + 100K × 3 = 1.3M; netAnnualBenefit = 400K
    expect(r.totalCost).toBe(1_300_000)
    expect(r.netAnnualBenefit).toBe(400_000)
    // Payback uses netAnnualBenefit: 1M / (400K/12) = 30 months
    expect(r.paybackMonths).toBeCloseTo(30, 6)
    // ROI% = (1.5M - 1.3M) / 1.3M × 100 ≈ 15.38
    expect(r.roiPercent).toBeCloseTo(15.3846, 3)
  })

  it('returns Infinity payback when annualOpex ≥ annualBenefit', () => {
    const r = computeROI({
      migrationCost: 1_000_000,
      annualOpex: 500_000,
      annualBenefit: 500_000,
      horizonYears: 3,
    })
    expect(r.netAnnualBenefit).toBe(0)
    expect(r.paybackMonths).toBe(Infinity)
  })

  it('discounts netAnnualBenefit (not gross) when opex is present', () => {
    const r = computeROI({
      migrationCost: 1_000_000,
      annualOpex: 100_000,
      annualBenefit: 500_000,
      horizonYears: 3,
      discountRate: 0.1,
    })
    const net = 400_000
    const expectedNpv = net / 1.1 + net / 1.21 + net / 1.331 - 1_000_000
    expect(r.npv).toBeCloseTo(expectedNpv, 2)
  })
})

// ── composeQuantumMultiplier ─────────────────────────────────────────────

describe('composeQuantumMultiplier', () => {
  it('returns 1.0 when every component is zero (no quantum uplift)', () => {
    expect(
      composeQuantumMultiplier({
        hndlExposurePct: 0,
        crqcAttackerUpliftPct: 0,
        detectionTimelineUpliftPct: 0,
      })
    ).toBe(1)
  })

  it('reproduces the legacy 2.5× default at 50/50/50', () => {
    expect(
      composeQuantumMultiplier({
        hndlExposurePct: 50,
        crqcAttackerUpliftPct: 50,
        detectionTimelineUpliftPct: 50,
      })
    ).toBe(2.5)
  })

  it('sums component uplifts additively', () => {
    expect(
      composeQuantumMultiplier({
        hndlExposurePct: 80,
        crqcAttackerUpliftPct: 60,
        detectionTimelineUpliftPct: 30,
      })
    ).toBeCloseTo(2.7, 6)
  })
})

// ── breachProbabilityFromRiskScore ───────────────────────────────────────

describe('breachProbabilityFromRiskScore', () => {
  it('halves the risk score', () => {
    expect(breachProbabilityFromRiskScore(40)).toBe(20)
  })

  it('caps at 50% for risk scores above 100', () => {
    expect(breachProbabilityFromRiskScore(100)).toBe(50)
    expect(breachProbabilityFromRiskScore(200)).toBe(50)
  })

  it('never returns a negative probability', () => {
    expect(breachProbabilityFromRiskScore(-10)).toBe(0)
  })

  it('returns 0 for a zero risk score', () => {
    expect(breachProbabilityFromRiskScore(0)).toBe(0)
  })
})

// ── selectCompliancePenalty ──────────────────────────────────────────────

describe('selectCompliancePenalty', () => {
  it('returns the fallback when no frameworks are mandated', () => {
    const { penalty, driverFramework } = selectCompliancePenalty([])
    expect(penalty).toBe(DEFAULT_MANDATED_PENALTY_FALLBACK)
    expect(driverFramework).toBeNull()
  })

  it('returns the max penalty across mandated frameworks and names the driver', () => {
    // GDPR ($20M) beats HIPAA ($1.5M)
    const { penalty, driverFramework } = selectCompliancePenalty(['HIPAA', 'GDPR'])
    expect(penalty).toBe(20_000_000)
    expect(driverFramework?.name).toBe('GDPR')
  })

  it('falls back to DEFAULT_FRAMEWORK_PENALTY for unknown frameworks', () => {
    const { penalty } = selectCompliancePenalty(['Totally Made Up Framework 9000'])
    // DEFAULT_FRAMEWORK_PENALTY = 500_000
    expect(penalty).toBe(500_000)
  })

  it('respects a custom fallback when list is empty', () => {
    const { penalty } = selectCompliancePenalty([], 3_500_000)
    expect(penalty).toBe(3_500_000)
  })
})

// ── computeMigrationCostFromProfile ──────────────────────────────────────

function makeAssessmentResult(overrides: {
  profile?: Partial<AssessmentProfile>
  vulnerableAlgos?: number
}): AssessmentResult {
  const profile: AssessmentProfile | undefined = overrides.profile
    ? ({
        industry: 'Other',
        algorithmsSelected: [],
        algorithmUnknown: false,
        sensitivityLevels: [],
        sensitivityUnknown: false,
        complianceFrameworks: [],
        complianceUnknown: false,
        migrationStatus: 'not-started',
        migrationUnknown: false,
        mode: 'comprehensive',
        useCasesUnknown: false,
        retentionUnknown: false,
        credentialLifetimeUnknown: false,
        infrastructureUnknown: false,
        agilityUnknown: false,
        vendorUnknown: false,
        scaleUnknown: false,
        timelineUnknown: false,
        ...overrides.profile,
      } as AssessmentProfile)
    : undefined

  return {
    riskScore: 50,
    riskLevel: 'medium',
    algorithmMigrations: Array.from({ length: overrides.vulnerableAlgos ?? 0 }, () => ({
      classical: 'RSA-2048',
      quantumVulnerable: true,
      replacement: 'ML-KEM-768',
      urgency: 'near-term',
      notes: '',
    })),
    complianceImpacts: [],
    recommendedActions: [],
    narrative: '',
    generatedAt: new Date().toISOString(),
    assessmentProfile: profile,
  }
}

describe('computeMigrationCostFromProfile', () => {
  it('enforces the MIGRATION_COST_FLOOR on an empty profile', () => {
    const { migrationCost } = computeMigrationCostFromProfile(makeAssessmentResult({}))
    expect(migrationCost).toBeGreaterThanOrEqual(MIGRATION_COST_FLOOR)
  })

  it('scales algorithm base by system-scale multiplier', () => {
    const smallOrg = computeMigrationCostFromProfile(
      makeAssessmentResult({
        vulnerableAlgos: 3,
        profile: { systemScale: '1-10' },
      })
    )
    const giantOrg = computeMigrationCostFromProfile(
      makeAssessmentResult({
        vulnerableAlgos: 3,
        profile: { systemScale: '200-plus' },
      })
    )
    expect(giantOrg.details.sysScale).toBe(3.0)
    expect(smallOrg.details.sysScale).toBe(1.0)
    expect(giantOrg.details.algoBase).toBeGreaterThan(smallOrg.details.algoBase)
  })

  it('applies vendor multiplier (open-source = 0.8x, heavy-vendor = 1.4x)', () => {
    const oss = computeMigrationCostFromProfile(
      makeAssessmentResult({
        vulnerableAlgos: 5,
        profile: { vendorDependency: 'open-source', systemScale: '51-200' },
      })
    )
    const vendor = computeMigrationCostFromProfile(
      makeAssessmentResult({
        vulnerableAlgos: 5,
        profile: { vendorDependency: 'heavy-vendor', systemScale: '51-200' },
      })
    )
    expect(oss.details.vendorMul).toBe(0.8)
    expect(vendor.details.vendorMul).toBe(1.4)
    expect(vendor.migrationCost).toBeGreaterThan(oss.migrationCost)
  })

  it('discounts migration cost when migration has started (0.4x)', () => {
    const notStarted = computeMigrationCostFromProfile(
      makeAssessmentResult({
        vulnerableAlgos: 5,
        profile: { migrationStatus: 'not-started', systemScale: '51-200' },
      })
    )
    const started = computeMigrationCostFromProfile(
      makeAssessmentResult({
        vulnerableAlgos: 5,
        profile: { migrationStatus: 'started', systemScale: '51-200' },
      })
    )
    expect(started.details.migrationDiscount).toBe(0.4)
    expect(notStarted.details.migrationDiscount).toBe(1.0)
    expect(started.migrationCost).toBeLessThan(notStarted.migrationCost)
  })

  it('hardcoded crypto agility penalizes with a 1.5x multiplier', () => {
    const abstracted = computeMigrationCostFromProfile(
      makeAssessmentResult({
        vulnerableAlgos: 5,
        profile: { cryptoAgility: 'fully-abstracted', systemScale: '51-200' },
      })
    )
    const hardcoded = computeMigrationCostFromProfile(
      makeAssessmentResult({
        vulnerableAlgos: 5,
        profile: { cryptoAgility: 'hardcoded', systemScale: '51-200' },
      })
    )
    expect(abstracted.details.agilityMul).toBe(0.6)
    expect(hardcoded.details.agilityMul).toBe(1.5)
    expect(hardcoded.migrationCost).toBeGreaterThan(abstracted.migrationCost)
  })

  it('uses DEFAULT_INFRA_LAYER_COST × 3 when infrastructure is unknown', () => {
    const { details } = computeMigrationCostFromProfile(
      makeAssessmentResult({
        vulnerableAlgos: 1,
        profile: { infrastructureUnknown: true },
      })
    )
    // Sub-category multiplier is 1.0 when there are no sub-categories.
    expect(details.infraBase).toBe(40_000 * 3)
  })

  it('sums per-layer costs when infrastructure layers are provided', () => {
    const { details } = computeMigrationCostFromProfile(
      makeAssessmentResult({
        vulnerableAlgos: 1,
        profile: { infrastructure: ['Hardware', 'Cloud'] },
      })
    )
    // Hardware 120K + Cloud 30K = 150K (no sub-categories → multiplier 1.0)
    expect(details.infraBase).toBe(150_000)
  })

  it('caps the sub-category multiplier at 2.0x', () => {
    // 10 sub-categories × 0.15 = +1.5x, would yield 2.5x if uncapped.
    const { details } = computeMigrationCostFromProfile(
      makeAssessmentResult({
        vulnerableAlgos: 1,
        profile: {
          infrastructure: ['Hardware'],
          infrastructureSubCategories: {
            Hardware: Array.from({ length: 10 }, (_, i) => `item-${i}`),
          },
        },
      })
    )
    // 120K × 2.0 = 240K (cap enforced)
    expect(details.infraBase).toBe(240_000)
  })

  it('treats zero vulnerable algorithms as one (prevents zeroing out)', () => {
    const { details } = computeMigrationCostFromProfile(
      makeAssessmentResult({ vulnerableAlgos: 0 })
    )
    expect(details.algoCount).toBe(1)
  })
})
