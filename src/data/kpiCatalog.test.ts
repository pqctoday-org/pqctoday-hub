// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  KPI_CATALOG,
  KPI_PERSONAS,
  buildDimensions,
  getKpiSet,
  getWeightSum,
  pqcReadinessTier,
  isPqcReady,
  isFips1403Validated,
  computePaceToDeadline,
} from './kpiCatalog'
import { getKpiTarget } from './kpiTargets'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'

// ── pqcReadinessTier ───────────────────────────────────────────────────────

describe('pqcReadinessTier', () => {
  it('returns 1.0 for "Yes (ML-KEM production)" narrative strings', () => {
    expect(pqcReadinessTier('Yes (ML-KEM production)')).toBe(1.0)
    expect(pqcReadinessTier('yes')).toBe(1.0)
  })

  it('returns 0.7 for hybrid/partial strings', () => {
    expect(pqcReadinessTier('Partial (ML-KEM only)')).toBe(0.7)
    expect(pqcReadinessTier('Hybrid X25519+ML-KEM')).toBe(0.7)
  })

  it('returns 0.2 for planned / roadmap / announced', () => {
    expect(pqcReadinessTier('Planned (Dilithium 2026)')).toBe(0.2)
    expect(pqcReadinessTier('Roadmap')).toBe(0.2)
    expect(pqcReadinessTier('Announced')).toBe(0.2)
  })

  it('returns 0 for None / No / empty', () => {
    expect(pqcReadinessTier('None')).toBe(0)
    expect(pqcReadinessTier('No')).toBe(0)
    expect(pqcReadinessTier('')).toBe(0)
    expect(pqcReadinessTier(null)).toBe(0)
    expect(pqcReadinessTier(undefined)).toBe(0)
  })

  it('returns a conservative middle (0.3) for narrative non-match', () => {
    expect(pqcReadinessTier('Credential')).toBe(0.3)
    expect(pqcReadinessTier('Identity')).toBe(0.3)
  })
})

// ── Catalog integrity ─────────────────────────────────────────────────────

describe('KPI_CATALOG integrity', () => {
  it('has unique KPI ids', () => {
    const ids = KPI_CATALOG.map((k) => k.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every personaed weight is a number between 0 and 1', () => {
    for (const k of KPI_CATALOG) {
      for (const p of KPI_PERSONAS) {
        const w = k.weights[p]
        if (w === undefined) continue
        expect(w).toBeGreaterThanOrEqual(0)
        expect(w).toBeLessThanOrEqual(1)
      }
    }
  })

  // Catalog weights encode RELATIVE importance; `buildDimensions` normalises
  // so the scorecard always sees weights summing to 1.0. We only assert that
  // every persona has some coverage on each surface.
  it('each persona has a positive weight budget on governance surface', () => {
    for (const p of KPI_PERSONAS) {
      const kpis = getKpiSet(p, 'governance')
      expect(kpis.length).toBeGreaterThan(0)
      expect(getWeightSum(kpis, p)).toBeGreaterThan(0.5)
    }
  })

  it('each persona has a positive weight budget on migration surface', () => {
    for (const p of KPI_PERSONAS) {
      const kpis = getKpiSet(p, 'migration')
      expect(kpis.length).toBeGreaterThan(0)
      expect(getWeightSum(kpis, p)).toBeGreaterThan(0.5)
    }
  })

  it('buildDimensions normalises weights to sum 1.0 for each persona/surface', () => {
    const mockExec: ExecutiveModuleData = {
      threatsByIndustry: new Map(),
      criticalThreatCount: 0,
      totalThreatCount: 0,
      industryThreats: [],
      vendorsByDomain: new Map(),
      fipsValidatedCount: 0,
      pqcReadyCount: 0,
      vendorReadinessWeighted: 0,
      vendorReadinessByDomain: new Map(),
      totalProducts: 1,
      frameworks: [],
      frameworksByIndustry: [],
      countryDeadlines: [],
      userCountryData: null,
      assessmentResult: null,
      riskScore: null,
      industry: '',
      country: '',
      complianceSelections: [],
      preBoostScore: null,
      boosts: [],
      hndlRiskWindow: null,
      tnflRiskWindow: null,
      categoryScores: null,
      categoryDrivers: null,
      migrationEffort: [],
      algorithmMigrations: [],
      keyFindings: [],
      assessmentProfile: null,
      myFrameworks: [],
      myProductIds: [],
      myProducts: [],
      myThreatIds: [],
      myThreats: [],
      myTimelineCountries: [],
      myTimelineCountryData: [],
      isAssessmentComplete: false,
      migrationDeadlineYear: null,
    }
    for (const p of KPI_PERSONAS) {
      for (const s of ['governance', 'migration'] as const) {
        const dims = buildDimensions(p, s, mockExec)
        const sum = dims.reduce((acc, d) => acc + d.weight, 0)
        expect(sum).toBeGreaterThan(0.99)
        expect(sum).toBeLessThan(1.01)
      }
    }
  })

  it('every surface listed on a KPI is a valid surface', () => {
    for (const k of KPI_CATALOG) {
      for (const s of k.surfaces) {
        expect(['governance', 'migration']).toContain(s)
      }
    }
  })
})

// ── getKpiSet / persona filtering ─────────────────────────────────────────

describe('getKpiSet', () => {
  it('executive governance set includes compliance + threat + HNDL', () => {
    const ids = getKpiSet('executive', 'governance').map((k) => k.id)
    expect(ids).toContain('compliance-gaps')
    expect(ids).toContain('threat-exposure')
    expect(ids).toContain('hndl-horizon')
  })

  it('ops set includes change-failure-rate and canary-coverage on migration', () => {
    const ids = getKpiSet('ops', 'migration').map((k) => k.id)
    expect(ids).toContain('change-failure-rate')
    expect(ids).toContain('canary-coverage')
  })

  it('researcher set includes algorithm-diversity + standards-coverage', () => {
    const ids = getKpiSet('researcher', 'governance').map((k) => k.id)
    expect(ids).toContain('algorithm-diversity')
    expect(ids).toContain('standards-coverage')
  })

  it('curious gets an empty set (nav-blocked)', () => {
    // @ts-expect-error — ensure the type rules out curious persona
    expect(getKpiSet('curious', 'governance')).toEqual([])
  })

  it('developer gets KPIs now that /business is unlocked', () => {
    const ids = getKpiSet('developer', 'governance').map((k) => k.id)
    expect(ids.length).toBeGreaterThan(0)
    expect(ids).toContain('systems-inventoried')
  })

  it('developer migration set covers the plan-spec dev KPIs (CC-05)', () => {
    const ids = getKpiSet('developer', 'migration').map((k) => k.id)
    // Plan §CC-05 calls out these as the developer-relevant migration KPIs.
    // Asserting them all together turns the audit into a regression gate.
    for (const required of [
      'algorithms-migrated',
      'hybrid-deployment',
      'cbom-completeness',
      'fips-validated',
      'change-failure-rate',
      'canary-coverage',
    ]) {
      expect(ids).toContain(required)
    }
  })
})

// ── Targets ────────────────────────────────────────────────────────────────

describe('getKpiTarget', () => {
  it('returns country-specific target when set', () => {
    expect(getKpiTarget('executive', 'United States', 'algorithms-migrated')).toBe(80)
  })

  it('falls back to persona-wildcard when country has no override', () => {
    expect(getKpiTarget('ops', 'Zimbabwe', 'systems-inventoried')).toBe(95)
  })

  it('falls back to the provided default when neither exists', () => {
    expect(getKpiTarget('researcher', null, 'unknown-kpi', 42)).toBe(42)
  })
})

// ── buildDimensions ────────────────────────────────────────────────────────

function mockData(overrides: Partial<ExecutiveModuleData> = {}): ExecutiveModuleData {
  return {
    threatsByIndustry: new Map(),
    criticalThreatCount: 3,
    totalThreatCount: 10,
    industryThreats: [],
    vendorsByDomain: new Map(),
    fipsValidatedCount: 5,
    pqcReadyCount: 7,
    vendorReadinessWeighted: 0.5,
    vendorReadinessByDomain: new Map(),
    totalProducts: 10,
    frameworks: [],
    frameworksByIndustry: [],
    countryDeadlines: [],
    userCountryData: null,
    assessmentResult: null,
    riskScore: null,
    industry: '',
    country: '',
    complianceSelections: [],
    preBoostScore: null,
    boosts: [],
    hndlRiskWindow: null,
    tnflRiskWindow: null,
    categoryScores: null,
    categoryDrivers: null,
    migrationEffort: [],
    algorithmMigrations: [],
    keyFindings: [],
    assessmentProfile: null,
    myFrameworks: [],
    myProductIds: [],
    myProducts: [],
    myThreatIds: [],
    myThreats: [],
    myTimelineCountries: [],
    myTimelineCountryData: [],
    isAssessmentComplete: false,
    migrationDeadlineYear: null,
    ...overrides,
  }
}

describe('buildDimensions', () => {
  it('marks HNDL horizon disabled when no assessment', () => {
    const dims = buildDimensions('executive', 'governance', mockData())
    const hndl = dims.find((d) => d.id === 'hndl-horizon')
    expect(hndl?.disabled).toBe(true)
    expect(hndl?.disabledReason).toBeDefined()
  })

  it('computes vendor-readiness auto-score from vendorReadinessWeighted', () => {
    // Architect now gets per-layer rows instead of the global vendor-readiness
    // KPI, so assert against a persona that still sees the global roll-up.
    const dims = buildDimensions(
      'ops',
      'migration',
      mockData({ vendorReadinessWeighted: 0.5, totalProducts: 10 })
    )
    const vr = dims.find((d) => d.id === 'vendor-readiness')
    expect(vr?.autoScore).toBe(50)
    expect(vr?.disabled).toBe(false)
  })

  it('disables vendor-readiness when totalProducts is zero', () => {
    const dims = buildDimensions('ops', 'migration', mockData({ totalProducts: 0 }))
    const vr = dims.find((d) => d.id === 'vendor-readiness')
    expect(vr?.disabled).toBe(true)
  })

  it('computes compliance-gaps auto-score from selected frameworks', () => {
    const frameworks = [
      {
        id: 'fips-203',
        label: 'FIPS 203',
        description: '',
        industries: [],
        countries: [],
        requiresPQC: true,
        pqcRequirement: 'yes' as const,
        deadline: '2025',
        deadlinePhase: 'active' as const,
        notes: '',
        enforcementBody: '',
        libraryRefs: [],
        timelineRefs: [],
        bodyType: 'technical_standard' as const,
      },
      {
        id: 'cmmc',
        label: 'CMMC',
        description: '',
        industries: [],
        countries: [],
        requiresPQC: false,
        pqcRequirement: 'no' as const,
        deadline: '2026',
        deadlinePhase: 'imminent' as const,
        notes: '',
        enforcementBody: '',
        libraryRefs: [],
        timelineRefs: [],
        bodyType: 'compliance_framework' as const,
      },
    ]
    const dims = buildDimensions(
      'executive',
      'governance',
      mockData({ frameworks, complianceSelections: ['fips-203', 'cmmc'] })
    )
    const cg = dims.find((d) => d.id === 'compliance-gaps')
    // 1 of 2 frameworks requires PQC → 50%
    expect(cg?.autoScore).toBe(50)
  })

  it('attaches country-specific target to algorithms-migrated for US executive', () => {
    const dims = buildDimensions('executive', 'governance', mockData(), 'United States')
    const am = dims.find((d) => d.id === 'algorithms-migrated')
    expect(am?.target).toBe(80)
    expect(am?.targetLabel).toContain('Target: 80')
  })
})

// ── E4: Board-ready NIST CSF composite ─────────────────────────────────────

describe('board-ready-composite (E4)', () => {
  it('is included in the executive governance set', () => {
    const ids = getKpiSet('executive', 'governance').map((k) => k.id)
    expect(ids).toContain('board-ready-composite')
  })

  it('disabled when assessment categoryScores missing', () => {
    const dims = buildDimensions('executive', 'governance', mockData({ categoryScores: null }))
    const brc = dims.find((d) => d.id === 'board-ready-composite')
    expect(brc?.disabled).toBe(true)
    expect(brc?.disabledActionHref).toBe('/assess')
  })

  it('computes 100 - avg(categoryScores) when assessment present', () => {
    const dims = buildDimensions(
      'executive',
      'governance',
      mockData({
        categoryScores: {
          quantumExposure: 80,
          migrationComplexity: 60,
          regulatoryPressure: 40,
          // higher-is-better readiness of 80 → concern 20, matching the other
          // three concern terms' average
          organizationalReadiness: 80,
        },
      })
    )
    const brc = dims.find((d) => d.id === 'board-ready-composite')
    // concern avg = (80 + 60 + 40 + (100-80)) / 4 = 50 → KPI = 100 - 50 = 50
    expect(brc?.autoScore).toBe(50)
    expect(brc?.disabled).toBe(false)
  })
})

// ── D9: Per-domain architect vendor readiness ──────────────────────────────
// Domain-keyed since 2026-08-27 (vendor-risk remediation, WS-6) — was
// infrastructure-layer keyed. Uses real DomainId values ('network',
// 'identity', 'atrest') so DOMAINS[domainId] resolves to a real label,
// matching what buildDimensions does against live data.

describe('vendor-readiness-by-domain (D9)', () => {
  it('expands into one dimension per non-empty migration domain', () => {
    const domains = new Map([
      ['network', { weighted: 0.6, count: 5 }],
      ['identity', { weighted: 0.3, count: 3 }],
      ['atrest', { weighted: 0.9, count: 2 }],
    ] as const)
    const dims = buildDimensions(
      'architect',
      'governance',
      mockData({ vendorReadinessByDomain: new Map(domains) })
    )
    const domainRows = dims.filter((d) => d.id.startsWith('vendor-readiness-by-domain:'))
    expect(domainRows).toHaveLength(3)
    const networkRow = domainRows.find((d) => d.label.includes('Network'))
    expect(networkRow?.autoScore).toBe(60)
    const identityRow = domainRows.find((d) => d.label.includes('Identity'))
    expect(identityRow?.autoScore).toBe(30)
    const dataRow = domainRows.find((d) => d.label.includes('Data-at-rest'))
    expect(dataRow?.autoScore).toBe(90)
  })

  it('falls back to disabled meta row when no domains are populated', () => {
    const dims = buildDimensions(
      'architect',
      'governance',
      mockData({ vendorReadinessByDomain: new Map() })
    )
    const meta = dims.find((d) => d.id === 'vendor-readiness-by-domain')
    expect(meta?.disabled).toBe(true)
  })

  it('splits the meta weight evenly across expanded rows', () => {
    const domains = new Map([
      ['network', { weighted: 0.5, count: 4 }],
      ['identity', { weighted: 0.5, count: 2 }],
    ] as const)
    const dims = buildDimensions(
      'architect',
      'governance',
      mockData({ vendorReadinessByDomain: new Map(domains) })
    )
    const domainRows = dims.filter((d) => d.id.startsWith('vendor-readiness-by-domain:'))
    const totalDomainWeight = domainRows.reduce((acc, d) => acc + d.weight, 0)
    // Both domain rows share the original meta weight; sum across all rows still normalises to 1.
    const sum = dims.reduce((acc, d) => acc + d.weight, 0)
    expect(sum).toBeGreaterThan(0.99)
    expect(sum).toBeLessThan(1.01)
    expect(domainRows[0].weight).toBeCloseTo(totalDomainWeight / 2, 6)
  })

  it('does not appear in executive or ops sets', () => {
    const execIds = getKpiSet('executive', 'governance').map((k) => k.id)
    const opsIds = getKpiSet('ops', 'migration').map((k) => k.id)
    expect(execIds).not.toContain('vendor-readiness-by-domain')
    expect(opsIds).not.toContain('vendor-readiness-by-domain')
  })
})

// ── E2: Regulatory exposure index ──────────────────────────────────────────

describe('regulatory-exposure-index (E2)', () => {
  it('is in the executive governance set only', () => {
    expect(
      getKpiSet('executive', 'governance')
        .map((k) => k.id)
        .includes('regulatory-exposure-index')
    ).toBe(true)
    expect(
      getKpiSet('executive', 'migration')
        .map((k) => k.id)
        .includes('regulatory-exposure-index')
    ).toBe(false)
  })

  it('disabled when no compliance selections', () => {
    const dims = buildDimensions('executive', 'governance', mockData({ complianceSelections: [] }))
    const rei = dims.find((d) => d.id === 'regulatory-exposure-index')
    expect(rei?.disabled).toBe(true)
  })

  it('scores lower for a single high-fine framework vs no fines', () => {
    const frameworks = [
      {
        id: 'GDPR',
        label: 'GDPR',
        description: '',
        industries: [],
        countries: [],
        requiresPQC: true,
        pqcRequirement: 'yes' as const,
        deadline: '',
        deadlinePhase: 'ongoing' as const,
        notes: '',
        enforcementBody: '',
        libraryRefs: [],
        timelineRefs: [],
        bodyType: 'compliance_framework' as const,
      },
    ]
    const dims = buildDimensions(
      'executive',
      'governance',
      mockData({ frameworks, complianceSelections: ['GDPR'] })
    )
    const rei = dims.find((d) => d.id === 'regulatory-exposure-index')
    // GDPR max fine = $25M in the lookup → score should be well below 100
    expect(rei?.disabled).toBe(false)
    expect(rei?.autoScore).toBeGreaterThan(0)
    expect(rei?.autoScore).toBeLessThan(100)
  })

  it('saturates to a low score when many high-fine frameworks are stacked', () => {
    // CNSA-2 (not CNSA-2.0) -- the real compliance CSV id, and the correct
    // frameworkFines.ts key as of the 2026-07-10 CNSA-2.0->CNSA-2 fix. This
    // fixture used to accidentally pass by matching the stale buggy key.
    const frameworks = ['GDPR', 'NIS2', 'CNSA-2', 'DORA', 'HIPAA'].map((id) => ({
      id,
      label: id,
      description: '',
      industries: [],
      countries: [],
      requiresPQC: true,
      pqcRequirement: 'yes' as const,
      deadline: '',
      deadlinePhase: 'ongoing' as const,
      notes: '',
      enforcementBody: '',
      libraryRefs: [],
      timelineRefs: [],
      bodyType: 'compliance_framework' as const,
    }))
    const dims = buildDimensions(
      'executive',
      'governance',
      mockData({ frameworks, complianceSelections: frameworks.map((f) => f.id) })
    )
    const rei = dims.find((d) => d.id === 'regulatory-exposure-index')
    // Total ≈ $551M → log-scaled score should be very low
    expect(rei?.autoScore).toBeLessThan(20)
  })
})

// ── E1: Crown-jewel coverage ───────────────────────────────────────────────

describe('crown-jewel-coverage (E1)', () => {
  it('is present in the executive governance set as a manual-input KPI', () => {
    const kpi = KPI_CATALOG.find((k) => k.id === 'crown-jewel-coverage')
    expect(kpi).toBeDefined()
    expect(kpi?.autoScore).toBeUndefined() // manual input today
    expect(kpi?.userOverride).toBe(true)
    expect(kpi?.weights.executive).toBeDefined()
  })

  it('renders as an enabled dimension (not disabled)', () => {
    const dims = buildDimensions('executive', 'governance', mockData())
    const cj = dims.find((d) => d.id === 'crown-jewel-coverage')
    expect(cj).toBeDefined()
    expect(cj?.disabled).toBeFalsy()
  })
})

describe('isPqcReady — one shared definition (RM-11)', () => {
  it('counts deployed/full and hybrid as ready', () => {
    expect(isPqcReady('Yes (ML-KEM production)')).toBe(true)
    expect(isPqcReady('Partial (ML-KEM, hybrid)')).toBe(true)
  })
  it('does NOT count planned, pilot, narrative or none as ready (the old over-count)', () => {
    expect(isPqcReady('Planned (ML-DSA 2026)')).toBe(false)
    expect(isPqcReady('Pilot')).toBe(false)
    expect(isPqcReady('Credential management')).toBe(false)
    expect(isPqcReady('None')).toBe(false)
    expect(isPqcReady('No')).toBe(false)
    expect(isPqcReady('')).toBe(false)
  })
})

describe('isFips1403Validated — 140-2 must not pass as 140-3 (RM-11)', () => {
  it('accepts explicit 140-3 / generic validated', () => {
    expect(isFips1403Validated('Yes (FIPS 140-3)')).toBe(true)
    expect(isFips1403Validated('FIPS 140-3 Level 2')).toBe(true)
    expect(isFips1403Validated('Validated')).toBe(true)
  })
  it('rejects FIPS 140-2 and negatives', () => {
    expect(isFips1403Validated('FIPS 140-2')).toBe(false)
    expect(isFips1403Validated('Yes (FIPS 140-2)')).toBe(false)
    expect(isFips1403Validated('No')).toBe(false)
    expect(isFips1403Validated('')).toBe(false)
  })
})

describe('computePaceToDeadline (real pace, not a constant)', () => {
  const NOW = 2027

  it('returns null when there is no deadline, start year, or progress signal', () => {
    expect(computePaceToDeadline(2024, null, 0.5, NOW)).toBeNull()
    expect(computePaceToDeadline(null, 2030, 0.5, NOW)).toBeNull()
    expect(computePaceToDeadline(2024, 2030, undefined, NOW)).toBeNull()
    // start year not before the deadline is nonsensical -> null
    expect(computePaceToDeadline(2030, 2030, 0.5, NOW)).toBeNull()
  })

  it('scores 50 when actual progress equals expected (on track)', () => {
    // 2024 -> 2030, now 2027: half-elapsed -> expected 0.5. progress 0.5 -> 50.
    expect(computePaceToDeadline(2024, 2030, 0.5, NOW)).toBe(50)
  })

  it('scores >50 when ahead of the expected line and <50 when behind', () => {
    expect(computePaceToDeadline(2024, 2030, 0.75, NOW)).toBeGreaterThan(50) // ahead
    expect(computePaceToDeadline(2024, 2030, 0.25, NOW)).toBeLessThan(50) // behind
  })

  it('clamps to [0,100] and never returns a fixed 50 regardless of inputs', () => {
    expect(computePaceToDeadline(2024, 2030, 1, NOW)).toBe(100) // way ahead -> capped
    expect(computePaceToDeadline(2024, 2030, 0, NOW)).toBe(0) // no progress -> floor
  })

  it('treats a reached/past deadline as max urgency (100)', () => {
    expect(computePaceToDeadline(2024, 2026, 0.1, NOW)).toBe(100)
  })

  it('returns 100 right at program start (nothing expected yet)', () => {
    expect(computePaceToDeadline(2027, 2030, 0, NOW)).toBe(100)
  })
})
