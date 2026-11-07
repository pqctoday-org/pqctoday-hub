// SPDX-License-Identifier: AGPL-3.0-only
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
  fips1403Stage,
  computePaceToDeadline,
} from './kpiCatalog'
import { getKpiTarget } from './kpiTargets'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import type { SoftwareItem } from '@/types/MigrateTypes'

// ── pqcReadinessTier ───────────────────────────────────────────────────────

describe('pqcReadinessTier', () => {
  it('returns 1.0 for "Yes (ML-KEM production)" narrative strings', () => {
    expect(pqcReadinessTier({ pqcSupport: 'Yes (ML-KEM production)' })).toBe(1.0)
    expect(pqcReadinessTier({ pqcSupport: 'yes' })).toBe(1.0)
  })

  it('returns 0.7 for hybrid/partial strings', () => {
    expect(pqcReadinessTier({ pqcSupport: 'Partial (ML-KEM only)' })).toBe(0.7)
    expect(pqcReadinessTier({ pqcSupport: 'Hybrid X25519+ML-KEM' })).toBe(0.7)
  })

  it('returns 0.2 for planned / roadmap / announced', () => {
    expect(pqcReadinessTier({ pqcSupport: 'Planned (Dilithium 2026)' })).toBe(0.2)
    expect(pqcReadinessTier({ pqcSupport: 'Roadmap' })).toBe(0.2)
    expect(pqcReadinessTier({ pqcSupport: 'Announced' })).toBe(0.2)
  })

  it('returns 0 for None / No / empty', () => {
    expect(pqcReadinessTier({ pqcSupport: 'None' })).toBe(0)
    expect(pqcReadinessTier({ pqcSupport: 'No' })).toBe(0)
    expect(pqcReadinessTier({ pqcSupport: '' })).toBe(0)
    expect(pqcReadinessTier({ pqcSupport: null })).toBe(0)
    expect(pqcReadinessTier({ pqcSupport: undefined })).toBe(0)
  })

  it('puts a pre-shared-key-only value at 0.4, even when its text mentions partial or planned algorithms', () => {
    expect(pqcReadinessTier({ pqcSupport: 'PSK (pre-shared key mixed in)' })).toBe(0.4)
    expect(pqcReadinessTier({ pqcSupport: 'psk (ML-KEM planned)' })).toBe(0.4)
    expect(pqcReadinessTier({ pqcSupport: 'PSK (partial hybrid support planned)' })).toBe(0.4)
  })

  it('returns a conservative middle (0.3) for narrative non-match', () => {
    expect(pqcReadinessTier({ pqcSupport: 'Credential' })).toBe(0.3)
    expect(pqcReadinessTier({ pqcSupport: 'Identity' })).toBe(0.3)
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
  it('keeps HNDL coverage unscored until organizational evidence is entered', () => {
    const dims = buildDimensions('executive', 'governance', mockData())
    const hndl = dims.find((d) => d.id === 'hndl-horizon')
    expect(hndl?.disabled).toBe(false)
    expect(hndl?.notYetScored).toBe(true)
    expect(hndl?.autoScore).toBe(0)
  })

  it('computes vendor readiness only from products explicitly selected by the learner', () => {
    const dims = buildDimensions(
      'ops',
      'migration',
      mockData({
        vendorReadinessWeighted: 0.1,
        totalProducts: 100,
        myProducts: [
          { pqcSupport: 'Yes (ML-KEM production)' },
          { pqcSupport: 'Planned' },
        ] as ExecutiveModuleData['myProducts'],
      })
    )
    const vr = dims.find((d) => d.id === 'vendor-readiness')
    expect(vr?.autoScore).toBe(60)
    expect(vr?.disabled).toBe(false)
  })

  it('disables vendor readiness when no organizational products are selected', () => {
    const dims = buildDimensions('ops', 'migration', mockData({ totalProducts: 100 }))
    const vr = dims.find((d) => d.id === 'vendor-readiness')
    expect(vr?.disabled).toBe(true)
  })

  it('does not treat selecting a PQC framework as closing a compliance gap', () => {
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
    expect(cg?.notYetScored).toBe(true)
    expect(cg?.autoScore).toBe(0)
  })

  it('attaches country-specific target to algorithms-migrated for US executive', () => {
    const dims = buildDimensions('executive', 'governance', mockData(), 'United States')
    const am = dims.find((d) => d.id === 'algorithms-migrated')
    expect(am?.target).toBe(80)
    expect(am?.targetLabel).toContain('Example target: 80')
  })
})

describe('removed executive composites', () => {
  it('does not present the authored board-ready composite as an organizational KPI', () => {
    const ids = getKpiSet('executive', 'governance').map((k) => k.id)
    expect(ids).not.toContain('board-ready-composite')
  })
})

// ── D9: Per-domain architect vendor readiness ──────────────────────────────
// Domain-keyed since 2026-08-27 (vendor-risk remediation, WS-6) — was
// infrastructure-layer keyed. Uses real DomainId values ('network',
// 'identity', 'atrest') so DOMAINS[domainId] resolves to a real label,
// matching what buildDimensions does against live data.

describe('vendor-readiness-by-domain (D9)', () => {
  it('expands into one dimension per non-empty migration domain', () => {
    const selectedProducts = [
      { categoryName: 'Network Security', infrastructureLayer: 'Network', pqcSupport: 'Planned' },
      { categoryName: 'Identity', infrastructureLayer: 'Application', pqcSupport: 'Hybrid' },
      { categoryName: 'Data Storage', infrastructureLayer: 'Database', pqcSupport: 'Yes' },
    ] as ExecutiveModuleData['myProducts']
    const dims = buildDimensions(
      'architect',
      'governance',
      mockData({ myProducts: selectedProducts })
    )
    const domainRows = dims.filter((d) => d.id.startsWith('vendor-readiness-by-domain:'))
    expect(domainRows).toHaveLength(3)
    const networkRow = domainRows.find((d) => d.label.includes('Network'))
    expect(networkRow?.autoScore).toBe(20)
    const identityRow = domainRows.find((d) => d.label.includes('Identity'))
    expect(identityRow?.autoScore).toBe(70)
    const dataRow = domainRows.find((d) => d.label.includes('Data-at-rest'))
    expect(dataRow?.autoScore).toBe(100)
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
    const selectedProducts = [
      { categoryName: 'Network Security', infrastructureLayer: 'Network', pqcSupport: 'Hybrid' },
      { categoryName: 'Identity', infrastructureLayer: 'Application', pqcSupport: 'Planned' },
    ] as ExecutiveModuleData['myProducts']
    const dims = buildDimensions(
      'architect',
      'governance',
      mockData({ myProducts: selectedProducts })
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

describe('regulatory exposure', () => {
  it('does not convert framework penalties into an executive KPI', () => {
    const ids = getKpiSet('executive', 'governance').map((k) => k.id)
    expect(ids).not.toContain('regulatory-exposure-index')
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
    expect(isPqcReady({ pqcSupport: 'Yes (ML-KEM production)' })).toBe(true)
    expect(isPqcReady({ pqcSupport: 'Partial (ML-KEM, hybrid)' })).toBe(true)
    expect(isPqcReady({ pqcSupport: 'Partial (ML-KEM planned)' })).toBe(true)
  })
  it('does NOT count a pre-shared-key-only product as ready', () => {
    expect(isPqcReady({ pqcSupport: 'PSK (pre-shared key mixed in)' })).toBe(false)
    expect(isPqcReady({ pqcSupport: 'PSK (ML-KEM planned, partial hybrid)' })).toBe(false)
  })
  it('does NOT count planned, pilot, narrative or none as ready (the old over-count)', () => {
    expect(isPqcReady({ pqcSupport: 'Planned (ML-DSA 2026)' })).toBe(false)
    expect(isPqcReady({ pqcSupport: 'Pilot' })).toBe(false)
    expect(isPqcReady({ pqcSupport: 'Credential management' })).toBe(false)
    expect(isPqcReady({ pqcSupport: 'None' })).toBe(false)
    expect(isPqcReady({ pqcSupport: 'No' })).toBe(false)
    expect(isPqcReady({ pqcSupport: '' })).toBe(false)
  })
})

describe('pqcReadinessTier — normalised catalogue status decides first', () => {
  it('maps each canonical status to its tier', () => {
    expect(pqcReadinessTier({ pqcStatusCanonical: 'available' })).toBe(1.0)
    expect(pqcReadinessTier({ pqcStatusCanonical: 'partial' })).toBe(0.7)
    expect(pqcReadinessTier({ pqcStatusCanonical: 'psk' })).toBe(0.4)
    expect(pqcReadinessTier({ pqcStatusCanonical: 'roadmap' })).toBe(0.2)
    expect(pqcReadinessTier({ pqcStatusCanonical: 'none' })).toBe(0)
  })

  it('lets the canonical status override the support text in both directions', () => {
    // Text that starts "Planned" but mentions hybrid and partial support: the text rule ticks it.
    const planned = 'Planned (partial hybrid support in the next release)'
    expect(pqcReadinessTier({ pqcSupport: planned })).toBe(0.7)
    expect(pqcReadinessTier({ pqcSupport: planned, pqcStatusCanonical: 'roadmap' })).toBe(0.2)
    expect(isPqcReady({ pqcSupport: planned, pqcStatusCanonical: 'roadmap' })).toBe(false)
    // Text that starts "Available" matches no text keyword (narrative middle); the status settles it.
    const available = 'Available (ML-KEM and ML-DSA in the current release)'
    expect(pqcReadinessTier({ pqcSupport: available })).toBe(0.3)
    expect(pqcReadinessTier({ pqcSupport: available, pqcStatusCanonical: 'available' })).toBe(1.0)
    expect(isPqcReady({ pqcSupport: available, pqcStatusCanonical: 'available' })).toBe(true)
    // An explicit none wins over optimistic text.
    expect(pqcReadinessTier({ pqcSupport: 'Yes (ML-KEM)', pqcStatusCanonical: 'none' })).toBe(0)
  })

  it('falls back to the support text when the status is blank, missing or unverified', () => {
    for (const pqcStatusCanonical of ['', '  ', undefined, null, 'unknown', 'something-else']) {
      expect(pqcReadinessTier({ pqcSupport: 'Yes (ML-KEM production)', pqcStatusCanonical })).toBe(
        1.0
      )
      expect(pqcReadinessTier({ pqcSupport: 'Planned (ML-DSA 2026)', pqcStatusCanonical })).toBe(
        0.2
      )
      expect(pqcReadinessTier({ pqcSupport: 'PSK (pre-shared key)', pqcStatusCanonical })).toBe(0.4)
      expect(pqcReadinessTier({ pqcSupport: 'None', pqcStatusCanonical })).toBe(0)
    }
  })

  it('keeps ready at 0.7 and above for every canonical status', () => {
    expect(isPqcReady({ pqcStatusCanonical: 'available' })).toBe(true)
    expect(isPqcReady({ pqcStatusCanonical: 'partial' })).toBe(true)
    expect(isPqcReady({ pqcStatusCanonical: 'psk' })).toBe(false)
    expect(isPqcReady({ pqcStatusCanonical: 'roadmap' })).toBe(false)
    expect(isPqcReady({ pqcStatusCanonical: 'none' })).toBe(false)
  })

  it('averages the canonical tier in the vendor readiness KPI', () => {
    const dims = buildDimensions(
      'ops',
      'migration',
      mockData({
        totalProducts: 100,
        myProducts: [
          { pqcSupport: 'Planned (partial hybrid)', pqcStatusCanonical: 'roadmap' },
          { pqcSupport: 'Available (ML-KEM)', pqcStatusCanonical: 'available' },
        ] as ExecutiveModuleData['myProducts'],
      })
    )
    // (0.2 + 1.0) / 2 = 0.6; the text rule alone would give (0.7 + 0.3) / 2 = 0.5.
    expect(dims.find((d) => d.id === 'vendor-readiness')?.autoScore).toBe(60)
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

describe('fips1403Stage — the source-backed stage decides, the free text only confirms 140-3', () => {
  it('counts a certificate only when the stage is yes AND the text names FIPS 140-3', () => {
    expect(
      fips1403Stage({ hasCertification: 'yes', fipsValidated: 'Yes (FIPS 140-3 L3 #4703)' })
    ).toBe('certified')
    expect(fips1403Stage({ hasCertification: 'yes', fipsValidated: 'Yes (FIPS 140-2 L3)' })).toBe(
      'none'
    )
    expect(fips1403Stage({ hasCertification: 'yes', fipsValidated: 'Yes (Trusted)' })).toBe('none')
    expect(fips1403Stage({ hasCertification: 'yes', fipsValidated: 'Yes (In Progress)' })).toBe(
      'none'
    )
    expect(
      fips1403Stage({
        hasCertification: 'yes',
        fipsValidated: 'No (CAVP algorithm validation, not a CMVP module validation)',
      })
    ).toBe('none')
  })
  it('counts a cited certificate even when a later PQC clause is still pending', () => {
    expect(
      fips1403Stage({
        hasCertification: 'yes',
        fipsValidated:
          'Yes — FIPS 140-3 Level 3, CMVP #4745 nShield 5s (Active), classical algorithms only; PQC resubmission pending',
      })
    ).toBe('certified')
  })
  it('never promotes free text without a matching stage', () => {
    expect(
      fips1403Stage({ hasCertification: 'unknown', fipsValidated: 'Yes (FIPS 140-3 CMVP)' })
    ).toBe('none')
    expect(
      fips1403Stage({ hasCertification: 'component', fipsValidated: 'Yes (AWS-LC FIPS 140-3)' })
    ).toBe('none')
  })
  it('reads the prerequisite and in-process stages from the stage field alone', () => {
    expect(fips1403Stage({ hasCertification: 'cavp', fipsValidated: 'Yes (CAVP Validated)' })).toBe(
      'cavp'
    )
    expect(fips1403Stage({ hasCertification: 'in_progress', fipsValidated: 'No' })).toBe(
      'in_process'
    )
  })
})

const hybrid = KPI_CATALOG.find((kpi) => kpi.id === 'hybrid-deployment')!

type Fields = Pick<SoftwareItem, 'hybridKemSupport' | 'hybridSigSupport' | 'pqcSupport'>

// Only the selected products are read by this specific auto-score function.
function selection(products: Partial<Fields>[], totalProducts: number): ExecutiveModuleData {
  return {
    myProducts: products.map((fields, index) => ({ softwareName: `Sample ${index}`, ...fields })),
    totalProducts,
  } as unknown as ExecutiveModuleData
}

const yes: Partial<Fields> = { hybridKemSupport: ['tls-default'] }
const experimental: Partial<Fields> = { hybridKemSupport: ['api-experimental'] }
const no: Partial<Fields> = { hybridKemSupport: ['none'], hybridSigSupport: 'none' }
const notAssessed: Partial<Fields> = {}

describe('selected catalogue hybrid support (structured fields)', () => {
  it('scores the assessed selected entries: yes counts one, experimental-only half', () => {
    expect(hybrid.autoScore!(selection([yes, yes], 250))).toBe(100)
    expect(hybrid.autoScore!(selection([yes, no, no, no], 250))).toBe(25)
    expect(hybrid.autoScore!(selection([experimental, no], 250))).toBe(25)
    expect(hybrid.autoScore!(selection([experimental], 250))).toBe(50)
  })

  it('rounds 100 x (yes + 0.5 x partial) / assessed to the nearest whole number', () => {
    // 1 / 3 = 33.33 rounds down; 1.5 / 4 = 37.5 rounds up; 2 / 3 = 66.67 rounds up.
    expect(hybrid.autoScore!(selection([yes, no, no], 250))).toBe(33)
    expect(hybrid.autoScore!(selection([yes, experimental, no, no], 250))).toBe(38)
    expect(hybrid.autoScore!(selection([yes, yes, no], 250))).toBe(67)
  })

  it('leaves entries with no structured entry out of the count', () => {
    expect(hybrid.autoScore!(selection([yes, notAssessed, notAssessed], 250))).toBe(100)
    expect(hybrid.autoScore!(selection([yes, no, notAssessed, notAssessed], 250))).toBe(50)
  })

  it('returns null when nothing in the selection is assessed', () => {
    expect(hybrid.autoScore!(selection([], 250))).toBeNull()
    expect(hybrid.autoScore!(selection([notAssessed, notAssessed], 250))).toBeNull()
  })

  it('does not read the free-text support description', () => {
    expect(
      hybrid.autoScore!(selection([{ pqcSupport: 'Hybrid X25519 + ML-KEM' }, { ...no }], 250))
    ).toBe(0)
    expect(hybrid.autoScore!(selection([{ pqcSupport: 'Planned hybrid support' }], 250))).toBeNull()
  })

  it('does not change when the unrelated catalogue population changes', () => {
    const products = [yes, no]
    expect(hybrid.autoScore!(selection(products, 250))).toBe(50)
    expect(hybrid.autoScore!(selection(products, 2000))).toBe(50)
    expect(hybrid.autoScore!(selection(products, 0))).toBe(50)
  })

  it('is labelled as a structured-field measure of the selected entries', () => {
    expect(hybrid.label).toBe('Hybrid support in selected catalogue entries (structured fields)')
    expect(hybrid.description).toContain('structured hybrid')
    expect(hybrid.description).toContain('does not establish deployment coverage')
    expect(hybrid.disabledReason).toContain('Select sample catalogue products')
  })
})
