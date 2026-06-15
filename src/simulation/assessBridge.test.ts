// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  serializeAssessReport,
  buildAssessReportDoc,
  simProfileFromAssess,
  complianceFromAssess,
  kpisFromAssess,
  algorithmBacklogFromAssess,
  twoTrackFromAssess,
} from './assessBridge'
import type { AssessmentResult } from '@/hooks/assessmentTypes'

const result = {
  riskScore: 72,
  riskLevel: 'high',
  algorithmMigrations: [],
  complianceImpacts: [{ framework: 'GDPR', requiresPQC: true, deadline: '2030', notes: '' }],
  recommendedActions: [
    {
      priority: 1,
      action: 'Build a CBOM',
      category: 'immediate',
      relatedModule: '/migrate',
      cswp39Step: 'inventory',
    },
  ],
  narrative: 'n',
  generatedAt: '2026-06-14T00:00:00Z',
  keyFindings: ['Long-lived data at risk'],
  frameworkRisk: { hndl: 80, tnfl: 40, regulatory: 70, feasibility: 55 },
  assessmentProfile: { industry: 'Healthcare', country: 'DE' },
} as unknown as AssessmentResult

describe('assessBridge', () => {
  it('serializes an assessment into a markdown scoping report', () => {
    const md = serializeAssessReport(result)
    expect(md).toContain('Quantum Readiness Assessment')
    expect(md).toContain('72/100 (high)')
    expect(md).toContain('HNDL 80')
    expect(md).toContain('[Inventory] Build a CBOM')
    expect(md).toContain('GDPR')
  })

  it('builds an initial-scoping ExecutiveDocument that satisfies the P0 step', () => {
    const doc = buildAssessReportDoc(result, 1000)
    expect(doc.type).toBe('initial-scoping')
    expect(doc.id).toBe('assess-scoping-1000')
    expect(doc.title).toContain('Healthcare')
    expect(doc.moduleId).toBeTruthy()
    expect(doc.data.length).toBeGreaterThan(0)
  })

  it('maps the assessment profile onto the sim sector/size/country dials', () => {
    const r = {
      assessmentProfile: {
        industry: 'Finance & Banking',
        systemScale: '51-200',
        country: 'Germany',
      },
    } as unknown as AssessmentResult
    expect(simProfileFromAssess(r)).toEqual({ sector: 'financial', size: 'large', country: 'DE' })
  })

  it('omits dials the sim does not model and returns {} with no profile', () => {
    const r = {
      assessmentProfile: { industry: 'Mining', systemScale: '11-50', country: 'Brazil' },
    } as unknown as AssessmentResult
    // industry/country unmodelled → dropped; size still maps
    expect(simProfileFromAssess(r)).toEqual({ size: 'mid' })
    expect(simProfileFromAssess({} as unknown as AssessmentResult)).toEqual({})
  })

  it('surfaces compliance, KPIs and the algorithm backlog (read-only)', () => {
    expect(complianceFromAssess(result).map((c) => c.framework)).toEqual(['GDPR'])
    expect(complianceFromAssess({} as unknown as AssessmentResult)).toEqual([])

    const withScores = {
      categoryScores: {
        quantumExposure: 80,
        migrationComplexity: 60,
        regulatoryPressure: 70,
        organizationalReadiness: 40,
      },
    } as unknown as AssessmentResult
    expect(kpisFromAssess(withScores)?.quantumExposure).toBe(80)
    expect(kpisFromAssess({} as unknown as AssessmentResult)).toBeNull()

    const withAlgos = {
      algorithmMigrations: [
        {
          classical: 'RSA-2048',
          quantumVulnerable: true,
          replacement: 'ML-KEM-768',
          urgency: 'immediate',
          notes: '',
        },
      ],
    } as unknown as AssessmentResult
    expect(algorithmBacklogFromAssess(withAlgos)).toHaveLength(1)
    expect(algorithmBacklogFromAssess({} as unknown as AssessmentResult)).toEqual([])
  })

  it('builds a two-track plan from recommended actions', () => {
    const plan = twoTrackFromAssess(result)
    expect(plan).toBeDefined()
    expect(plan?.trackA.id).toBe('A')
    expect(plan?.trackB.id).toBe('B')
    expect(twoTrackFromAssess({} as unknown as AssessmentResult)).toBeUndefined()
  })
})
