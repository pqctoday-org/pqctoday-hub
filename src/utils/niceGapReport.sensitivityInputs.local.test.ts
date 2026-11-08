// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { generateNiceGapReport } from './niceGapReport'
import type { AssessmentInput, AssessmentResult } from '../hooks/assessmentTypes'
const input: AssessmentInput = {
  industry: 'Technology',
  currentCrypto: [],
  dataSensitivity: [],
  complianceRequirements: [],
  migrationStatus: 'planning',
}
const result: AssessmentResult = {
  riskScore: 40,
  riskLevel: 'medium',
  algorithmMigrations: [],
  complianceImpacts: [],
  recommendedActions: [],
  narrative: '',
  generatedAt: '2026-11-05T00:00:00Z',
}
const reportFor = (dataSensitivity: string[], extra: Partial<AssessmentInput> = {}) =>
  generateNiceGapReport({ ...input, dataSensitivity, ...extra }, result)
const dataGap = (report: ReturnType<typeof reportFor>) =>
  report.competencyGaps.find((gap) => gap.competencyAreaId === 'CA-DATASEC')

describe('current assessment sensitivity IDs in workforce learning guidance', () => {
  it.each(['high', 'critical'])(
    'recognizes a lone%s selection in the same report and export',
    (level) => {
      const report = reportFor([level])
      const gap = dataGap(report)
      expect(gap).toBeDefined()
      expect(gap!.rationale).toContain('High-sensitivity data')
      expect(gap!.targetTier).toBe('awareness')
      // Existing high0.8weight ranks above defaultcrypto0.6; weights themselves are not changed.
      expect(report.competencyGaps[0].competencyAreaId).toBe('CA-DATASEC')
      expect((report.exportData as { competencyGaps: unknown[] }).competencyGaps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            competencyAreaId: 'CA-DATASEC',
            targetTier: gap!.targetTier,
            rationale: gap!.rationale,
          }),
        ])
      )
    }
  )
  it.each([
    { levels: ['low'] },
    { levels: ['medium'] },
    { levels: [] },
    { levels: ['highly-sensitive'] },
    { levels: ['restricted'] },
  ])('does not classify $levels as a canonical high selection', ({ levels }) => {
    expect(dataGap(reportFor(levels))).toBeUndefined()
  })
  it('keeps the existing diversity path distinct from high-sensitivity and preserves persona tiers', () => {
    const report = reportFor(['low', 'medium'])
    expect(dataGap(report)!.rationale).toContain('diverse data classifications')
    expect(report.competencyGaps[0].competencyAreaId).not.toBe('CA-DATASEC')
    expect(dataGap(reportFor(['high'], { persona: 'developer' }))!.targetTier).toBe('practitioner')
    expect(dataGap(reportFor(['low', 'medium'], { persona: 'developer' }))!.targetTier).toBe(
      'practitioner'
    )
  })
  it('does not treat smart defaults accompanying an unknown answer as established classifications', () => {
    expect(dataGap(reportFor(['high', 'critical'], { sensitivityUnknown: true }))).toBeUndefined()
    expect(dataGap(reportFor(['low', 'medium'], { sensitivityUnknown: true }))).toBeUndefined()
    expect(dataGap(reportFor([], { sensitivityUnknown: true }))).toBeUndefined()
  })
})
