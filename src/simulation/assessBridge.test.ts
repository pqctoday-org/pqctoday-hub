// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { serializeAssessReport, buildAssessReportDoc } from './assessBridge'
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
})
