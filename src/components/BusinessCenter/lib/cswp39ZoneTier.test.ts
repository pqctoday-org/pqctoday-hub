// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Zone tiers for Assets, Management Tools and Mitigation come from each zone's
 * own tools (lib/cswp39Tier.ts, ZONE_OWN_TIER). Migration and Risk Management
 * keep their step rules. These tests pin each zone's own tier and the places
 * where one zone's tools used to leak into another zone's tier.
 */
import { describe, it, expect } from 'vitest'
import {
  computeZoneTiers,
  missingForNextTier,
  missingForNextZoneTier,
  zoneHintTier,
} from './cswp39Tier'
import type { BusinessMetrics } from '../hooks/useBusinessMetrics'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'

function doc(type: ExecutiveDocumentType, idx = 0, data = '{}'): ExecutiveDocument {
  return { id: `${type}-${idx}`, moduleId: 'test', type, title: type, data, createdAt: 0 }
}

function emptyMetrics(): BusinessMetrics {
  return {
    riskScore: null,
    riskLevel: null,
    categoryScores: null,
    assessmentStatus: 'not-started',
    assessmentHistory: [],
    previousRiskScore: null,
    previousCategoryScores: null,
    completedAt: null,
    trackedFrameworks: [],
    pqcFrameworkReviewCount: 0,
    governanceModules: [],
    cryptoAgility: 'Not assessed',
    migrationStatus: 'Not assessed',
    vendorDependency: '',
    vendorUnknown: false,
    vendorModuleProgress: {
      id: 'vendor-risk',
      title: 'Vendor Risk',
      status: 'not-started',
      completedSteps: 0,
      totalSteps: 0,
    },
    uniqueVendorCount: 0,
    bookmarkedProducts: [],
    infraLayerCoverage: [],
    fipsBreakdown: { validated: 0, partial: 0, none: 0 },
    workflowActive: false,
    completedPhases: [],
    actionItems: [],
    execModuleProgress: [],
    grcModuleProgress: [],
    artifactsByPillar: {
      risk: [],
      compliance: [],
      governance: [],
      vendor: [],
      inventory: [],
      architecture: [],
    },
    assessmentResult: null,
    industry: '',
    country: '',
    persona: null,
    isFullyEmpty: true,
  }
}

const layers = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    layer: `L${i}`,
    assessed: true,
    productCount: 1,
    status: 'covered' as const,
  }))

const products = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}` }) as never)

const GATEWAY = '## Mitigation Gateway (CSWP.39 §4.6)\n'
const DECOMMISSION = '## Decommission Plan (CSWP.39 §4.6)\n'
const EVIDENCE = '## Evidence (CSWP.39 §5.5 — CMVP / ACVP / ESV / CVE-scan)\n'
const CBOM_SECTION = '## CBOM (CSWP.39 §5.2 — 6 asset classes)\n\n## Pipeline Sources\nfoo\n'

const tiers = (m: BusinessMetrics) => computeZoneTiers(m)

describe('Assets — its own tier rule (CBOM)', () => {
  it('saving the CBOM raises Assets to Tier 2', () => {
    const m = emptyMetrics()
    expect(tiers(m).assets.tier).toBe(1)
    m.artifactsByPillar.inventory = [doc('crypto-cbom')]
    expect(tiers(m).assets.tier).toBe(2)
  })

  it('Tier 3 needs the CBOM plus 6 assessed layers and 5 products', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.inventory = [doc('crypto-cbom')]
    m.infraLayerCoverage = layers(6)
    expect(tiers(m).assets.tier).toBe(2)
    m.bookmarkedProducts = products(5)
    expect(tiers(m).assets.tier).toBe(3)
  })

  it('Tier 4 needs the Tier 3 conditions plus 8 layers, FIPS dominance and the CBOM section', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.inventory = [doc('crypto-cbom')]
    m.infraLayerCoverage = layers(8)
    m.bookmarkedProducts = products(5)
    m.fipsBreakdown = { validated: 5, partial: 0, none: 0 }
    m.artifactsByPillar.vendor = [doc('supply-chain-matrix', 0, CBOM_SECTION)]
    expect(tiers(m).assets.tier).toBe(4)
    m.fipsBreakdown = { validated: 0, partial: 0, none: 0 }
    expect(tiers(m).assets.tier).toBe(3)
  })

  it('the CBOM counts for Assets only, not for another zone', () => {
    const m = emptyMetrics()
    const before = tiers(m)
    m.artifactsByPillar.inventory = [doc('crypto-cbom')]
    const after = tiers(m)
    expect(after.mitigation.tier).toBe(before.mitigation.tier)
    expect(after.migration.tier).toBe(before.migration.tier)
    expect(after['management-tools'].tier).toBe(before['management-tools'].tier)
  })
})

describe('Management Tools — its own tier rule (audit + vulnerability watch)', () => {
  it('saving the management-tools audit raises Management Tools to Tier 2', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.governance = [doc('management-tools-audit')]
    expect(tiers(m)['management-tools'].tier).toBe(2)
  })

  it('saving the vulnerability watch raises Management Tools to Tier 2', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.risk = [doc('crypto-vulnerability-watch')]
    expect(tiers(m)['management-tools'].tier).toBe(2)
  })

  it('Tier 3 needs both tools and an assessment result', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.governance = [doc('management-tools-audit')]
    m.artifactsByPillar.risk = [doc('crypto-vulnerability-watch')]
    expect(tiers(m)['management-tools'].tier).toBe(2)
    m.assessmentResult = { riskScore: 40 } as never
    expect(tiers(m)['management-tools'].tier).toBe(3)
  })

  it('Tier 4 needs Tier 3 plus two assessments and observability tooling notes', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.governance = [doc('management-tools-audit')]
    m.artifactsByPillar.risk = [doc('crypto-vulnerability-watch')]
    m.assessmentResult = { riskScore: 40 } as never
    m.assessmentHistory = [
      { completedAt: '2025-01-01', riskScore: 50 },
      { completedAt: '2025-06-01', riskScore: 40 },
    ]
    m.artifactsByPillar.vendor = [
      doc('vendor-scorecard', 0, '## Observability Tooling Notes (CSWP.39 §5.3)\n'),
    ]
    expect(tiers(m)['management-tools'].tier).toBe(4)
    m.assessmentHistory = m.assessmentHistory.slice(0, 1)
    expect(tiers(m)['management-tools'].tier).toBe(3)
  })

  it('a management-tools artifact no longer changes Risk Management', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.risk = [doc('risk-register')]
    const before = tiers(m)['risk-management']
    m.artifactsByPillar.governance = [doc('management-tools-audit')]
    m.artifactsByPillar.risk = [...m.artifactsByPillar.risk, doc('crypto-vulnerability-watch')]
    expect(tiers(m)['risk-management']).toEqual(before)
  })
})

describe('Mitigation — its own tier rule (deployment playbook, infra modernization, data-at-rest)', () => {
  it('saving a mitigation tool raises Mitigation to Tier 2', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.vendor = [doc('deployment-playbook')]
    expect(tiers(m).mitigation.tier).toBe(2)
  })

  it('Tier 3 needs two of its tools and a gateway or decommission section', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.vendor = [doc('deployment-playbook')]
    m.artifactsByPillar.architecture = [doc('infra-modernization-plan')]
    expect(tiers(m).mitigation.tier).toBe(2)
    m.artifactsByPillar.vendor = [doc('deployment-playbook', 0, DECOMMISSION)]
    expect(tiers(m).mitigation.tier).toBe(3)
  })

  it('Tier 4 needs all three tools, the gateway, decommission and evidence sections, and FIPS', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.vendor = [
      doc('deployment-playbook', 0, DECOMMISSION),
      doc('migration-roadmap', 0, GATEWAY),
    ]
    m.artifactsByPillar.architecture = [doc('infra-modernization-plan')]
    m.artifactsByPillar.risk = [doc('data-at-rest-strategy')]
    m.artifactsByPillar.compliance = [doc('audit-checklist', 0, EVIDENCE)]
    m.fipsBreakdown = { validated: 1, partial: 0, none: 0 }
    expect(tiers(m).mitigation.tier).toBe(4)
    m.fipsBreakdown = { validated: 0, partial: 0, none: 0 }
    expect(tiers(m).mitigation.tier).toBe(3)
  })

  it('a mitigation tool no longer raises Migration when Migration has no roadmap', () => {
    const m = emptyMetrics()
    const before = tiers(m).migration
    m.artifactsByPillar.architecture = [doc('infra-modernization-plan')]
    m.artifactsByPillar.risk = [doc('data-at-rest-strategy')]
    expect(tiers(m).migration).toEqual(before)
  })

  it('a mitigation tool no longer raises Migration when Migration has a roadmap and treatment plan', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.vendor = [doc('migration-roadmap')]
    m.artifactsByPillar.risk = [doc('risk-treatment-plan')]
    const before = tiers(m).migration.tier
    expect(before).toBe(2)
    m.artifactsByPillar.architecture = [doc('infra-modernization-plan')]
    m.artifactsByPillar.risk = [...m.artifactsByPillar.risk, doc('data-at-rest-strategy')]
    expect(tiers(m).migration.tier).toBe(before)
  })

  // Known remaining path, pinned on purpose. The deployment playbook is also a
  // Migration signal: Migration's rule (implementTier) counts it, and Migration
  // keeps that rule. Whether the playbook should leave Migration's rule is an
  // owner decision (see the Q4 report).
  it('a deployment playbook still counts toward Migration, because Migration keeps its rule', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.vendor = [doc('migration-roadmap')]
    m.artifactsByPillar.risk = [doc('risk-treatment-plan')]
    expect(tiers(m).migration.tier).toBe(2)
    m.artifactsByPillar.vendor = [...m.artifactsByPillar.vendor, doc('deployment-playbook')]
    expect(tiers(m).migration.tier).toBe(3)
  })
})

describe('Risk Management — unchanged contributors', () => {
  it('risk-management still takes its tier from prioritise and identify-gaps', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.risk = [doc('risk-register')]
    expect(tiers(m)['risk-management'].tier).toBe(2)
  })
})

describe('missing-for-next-tier hints name the zone own tools', () => {
  it('Assets at Tier 1 asks for a CBOM', () => {
    expect(missingForNextZoneTier('assets', emptyMetrics())).toMatch(/CBOM/)
  })

  it('Management Tools at Tier 2 names the tool that is not on file', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.governance = [doc('management-tools-audit')]
    m.assessmentResult = { riskScore: 40 } as never
    expect(zoneHintTier('management-tools', m)).toBe(2)
    expect(missingForNextZoneTier('management-tools', m)).toMatch(/crypto vulnerability watch/)
  })

  it('Mitigation at Tier 2 names the zone tools still missing', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.vendor = [doc('deployment-playbook')]
    const hint = missingForNextZoneTier('mitigation', m)
    expect(hint).toMatch(/infrastructure modernization plan/)
    expect(hint).toMatch(/data-at-rest strategy/)
  })

  it('a zone at Tier 4 has no hint', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.governance = [doc('management-tools-audit')]
    m.artifactsByPillar.risk = [doc('crypto-vulnerability-watch')]
    m.assessmentResult = { riskScore: 40 } as never
    m.assessmentHistory = [
      { completedAt: '2025-01-01', riskScore: 50 },
      { completedAt: '2025-06-01', riskScore: 40 },
    ]
    m.artifactsByPillar.vendor = [
      doc('vendor-scorecard', 0, '## Observability Tooling Notes (CSWP.39 §5.3)\n'),
    ]
    expect(tiers(m)['management-tools'].tier).toBe(4)
    expect(missingForNextZoneTier('management-tools', m)).toBeNull()
  })

  it('Migration hints are the same as the implement step hints', () => {
    const m = emptyMetrics()
    expect(zoneHintTier('migration', m)).toBe(1)
    expect(missingForNextZoneTier('migration', m)).toBe(missingForNextTier('implement', m, 1))
  })
})
