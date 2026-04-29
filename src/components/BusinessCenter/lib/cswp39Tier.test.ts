// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  computeStepTiers,
  governTier,
  inventoryTier,
  identifyGapsTier,
  prioritiseTier,
  implementTier,
} from './cswp39Tier'
import type { BusinessMetrics } from '../hooks/useBusinessMetrics'
import type { ExecutiveDocument, ExecutiveDocumentType } from '@/services/storage/types'

function doc(type: ExecutiveDocumentType, idx = 0, data = '{}'): ExecutiveDocument {
  return {
    id: `${type}-${idx}`,
    moduleId: 'test',
    type,
    title: type,
    data,
    createdAt: 0,
  }
}

function emptyMetrics(): BusinessMetrics {
  return {
    riskScore: null,
    riskLevel: null,
    categoryScores: null,
    assessmentStatus: 'not-started',
    assessmentHistory: [],
    previousRiskScore: null,
    completedAt: null,
    trackedFrameworks: [],
    complianceGapCount: 0,
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

describe('cswp39Tier — govern', () => {
  it('tier 1 when nothing in place', () => {
    expect(governTier(emptyMetrics()).tier).toBe(1)
  })

  it('tier 2 when policy draft present', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.governance = [doc('policy-draft')]
    expect(governTier(m).tier).toBe(2)
  })

  it('tier 3 when policy + RACI + checklist present', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.governance = [doc('policy-draft'), doc('raci-matrix')]
    m.artifactsByPillar.compliance = [doc('audit-checklist')]
    expect(governTier(m).tier).toBe(3)
  })

  it('tier 4 requires modules completed + contract clause + exceptions section', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.governance = [doc('policy-draft'), doc('raci-matrix')]
    m.artifactsByPillar.compliance = [
      doc('audit-checklist', 0, '## Exceptions (CSWP.39 §5.1)\nrow 1\n'),
    ]
    m.artifactsByPillar.vendor = [doc('contract-clause')]
    m.governanceModules = [
      {
        id: 'pqc-governance',
        title: 'Governance',
        status: 'completed',
        completedSteps: 5,
        totalSteps: 5,
      },
    ]
    expect(governTier(m).tier).toBe(4)
  })

  it('govern tier caps at 3 if exceptions section is missing', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.governance = [doc('policy-draft'), doc('raci-matrix')]
    m.artifactsByPillar.compliance = [doc('audit-checklist')]
    m.artifactsByPillar.vendor = [doc('contract-clause')]
    m.governanceModules = [
      {
        id: 'pqc-governance',
        title: 'Governance',
        status: 'completed',
        completedSteps: 5,
        totalSteps: 5,
      },
    ]
    expect(governTier(m).tier).toBe(3)
  })
})

describe('cswp39Tier — inventory', () => {
  it('tier 1 with no products and no matrix', () => {
    expect(inventoryTier(emptyMetrics()).tier).toBe(1)
  })

  it('tier 2 once assessment is complete', () => {
    const m = emptyMetrics()
    m.assessmentStatus = 'complete'
    expect(inventoryTier(m).tier).toBe(2)
  })

  it('tier 3 with ≥6 layers assessed and ≥5 products', () => {
    const m = emptyMetrics()
    m.bookmarkedProducts = Array.from({ length: 5 }, (_, i) => ({ id: `p${i}` }) as never)
    m.infraLayerCoverage = Array.from({ length: 6 }, (_, i) => ({
      layer: `L${i}`,
      assessed: true,
      productCount: 1,
      status: 'covered' as const,
    }))
    expect(inventoryTier(m).tier).toBe(3)
  })

  it('tier 4 needs FIPS-validated dominance + 8 layers + supply matrix + CBOM/Pipeline sections', () => {
    const m = emptyMetrics()
    m.bookmarkedProducts = Array.from({ length: 5 }, (_, i) => ({ id: `p${i}` }) as never)
    m.infraLayerCoverage = Array.from({ length: 8 }, (_, i) => ({
      layer: `L${i}`,
      assessed: true,
      productCount: 1,
      status: 'covered' as const,
    }))
    m.fipsBreakdown = { validated: 5, partial: 0, none: 0 }
    m.artifactsByPillar.vendor = [
      doc(
        'supply-chain-matrix',
        0,
        '## CBOM (CSWP.39 §5.2 — 6 asset classes)\n\n## Pipeline Sources (CSWP.39 §5.2)\nfoo\n'
      ),
    ]
    expect(inventoryTier(m).tier).toBe(4)
  })

  it('inventory caps at 3 if CBOM/Pipeline sections are missing', () => {
    const m = emptyMetrics()
    m.bookmarkedProducts = Array.from({ length: 5 }, (_, i) => ({ id: `p${i}` }) as never)
    m.infraLayerCoverage = Array.from({ length: 8 }, (_, i) => ({
      layer: `L${i}`,
      assessed: true,
      productCount: 1,
      status: 'covered' as const,
    }))
    m.fipsBreakdown = { validated: 5, partial: 0, none: 0 }
    m.artifactsByPillar.vendor = [doc('supply-chain-matrix')]
    expect(inventoryTier(m).tier).toBe(3)
  })
})

describe('cswp39Tier — identify gaps', () => {
  it('tier 1 with nothing on file', () => {
    expect(identifyGapsTier(emptyMetrics()).tier).toBe(1)
  })

  it('tier 2 with risk register', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.risk = [doc('risk-register')]
    expect(identifyGapsTier(m).tier).toBe(2)
  })

  it('tier 3 with register + scorecard + tracked frameworks', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.risk = [doc('risk-register')]
    m.artifactsByPillar.vendor = [doc('vendor-scorecard')]
    m.trackedFrameworks = [{ id: 'f' } as never]
    expect(identifyGapsTier(m).tier).toBe(3)
  })

  it('tier 4 needs ≥2 assessments + observability tooling notes', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.risk = [doc('risk-register')]
    m.artifactsByPillar.vendor = [
      doc('vendor-scorecard', 0, '## Observability Tooling Notes (CSWP.39 §5.3)\n'),
    ]
    m.trackedFrameworks = [{ id: 'f' } as never]
    m.assessmentHistory = [
      { completedAt: '2025-01-01', riskScore: 50 },
      { completedAt: '2025-06-01', riskScore: 40 },
    ]
    expect(identifyGapsTier(m).tier).toBe(4)
  })

  it('identify-gaps caps at 3 if observability notes missing', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.risk = [doc('risk-register')]
    m.artifactsByPillar.vendor = [doc('vendor-scorecard')]
    m.trackedFrameworks = [{ id: 'f' } as never]
    m.assessmentHistory = [
      { completedAt: '2025-01-01', riskScore: 50 },
      { completedAt: '2025-06-01', riskScore: 40 },
    ]
    expect(identifyGapsTier(m).tier).toBe(3)
  })
})

describe('cswp39Tier — prioritise', () => {
  it('tier 1 when nothing scheduled', () => {
    expect(prioritiseTier(emptyMetrics()).tier).toBe(1)
  })

  it('tier 2 with KPI dashboard alone', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.governance = [doc('kpi-dashboard')]
    expect(prioritiseTier(m).tier).toBe(2)
  })

  it('tier 3 with timeline + KPI', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.compliance = [doc('compliance-timeline')]
    m.artifactsByPillar.vendor = [doc('kpi-tracker')]
    expect(prioritiseTier(m).tier).toBe(3)
  })

  it('tier 4 needs CRQC + KPI (with formula explainer) + ≥3 assessments', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.risk = [doc('crqc-scenario')]
    m.artifactsByPillar.vendor = [doc('kpi-tracker')]
    m.artifactsByPillar.compliance = [doc('compliance-timeline')]
    m.artifactsByPillar.governance = [
      doc('kpi-dashboard', 0, '## Formula Explainer (CSWP.39 §5.4)\n'),
    ]
    m.assessmentHistory = Array.from({ length: 3 }, (_, i) => ({
      completedAt: `2025-0${i + 1}-01`,
      riskScore: 50,
    }))
    expect(prioritiseTier(m).tier).toBe(4)
  })

  it('prioritise caps at 3 if formula explainer missing', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.risk = [doc('crqc-scenario')]
    m.artifactsByPillar.vendor = [doc('kpi-tracker')]
    m.artifactsByPillar.compliance = [doc('compliance-timeline')]
    m.assessmentHistory = Array.from({ length: 3 }, (_, i) => ({
      completedAt: `2025-0${i + 1}-01`,
      riskScore: 50,
    }))
    expect(prioritiseTier(m).tier).toBe(3)
  })
})

describe('cswp39Tier — implement', () => {
  it('tier 1 when not assessed and no plan', () => {
    expect(implementTier(emptyMetrics()).tier).toBe(1)
  })

  it('tier 2 when migration roadmap present', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.vendor = [doc('migration-roadmap')]
    expect(implementTier(m).tier).toBe(2)
  })

  it('tier 3 with roadmap + treatment + playbook', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.vendor = [doc('migration-roadmap'), doc('deployment-playbook')]
    m.artifactsByPillar.risk = [doc('risk-treatment-plan')]
    expect(implementTier(m).tier).toBe(3)
  })

  it('tier 4 needs workflow + 3 phases + FIPS + mitigation/decommission/evidence sections', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.vendor = [
      doc('migration-roadmap', 0, '## Mitigation Gateway (CSWP.39 §4.6)\n'),
      doc('deployment-playbook', 0, '## Decommission Plan (CSWP.39 §4.6)\n'),
    ]
    m.artifactsByPillar.risk = [doc('risk-treatment-plan')]
    m.artifactsByPillar.compliance = [
      doc('audit-checklist', 0, '## Evidence (CSWP.39 §5.5 — CMVP / ACVP / ESV / CVE-scan)\n'),
    ]
    m.workflowActive = true
    m.completedPhases = ['p1', 'p2', 'p3']
    m.fipsBreakdown = { validated: 1, partial: 0, none: 0 }
    expect(implementTier(m).tier).toBe(4)
  })

  it('implement caps at 3 if mitigation/decommission/evidence sections missing', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.vendor = [doc('migration-roadmap'), doc('deployment-playbook')]
    m.artifactsByPillar.risk = [doc('risk-treatment-plan')]
    m.workflowActive = true
    m.completedPhases = ['p1', 'p2', 'p3']
    m.fipsBreakdown = { validated: 1, partial: 0, none: 0 }
    expect(implementTier(m).tier).toBe(3)
  })
})

describe('computeStepTiers', () => {
  it('returns tier 1 across all five steps for empty metrics', () => {
    const t = computeStepTiers(emptyMetrics())
    expect(t.govern.tier).toBe(1)
    expect(t.inventory.tier).toBe(1)
    expect(t['identify-gaps'].tier).toBe(1)
    expect(t.prioritise.tier).toBe(1)
    expect(t.implement.tier).toBe(1)
  })

  it('reasons array is non-empty when signals present', () => {
    const m = emptyMetrics()
    m.artifactsByPillar.governance = [doc('policy-draft')]
    const t = computeStepTiers(m)
    expect(t.govern.reasons.length).toBeGreaterThan(0)
  })
})
