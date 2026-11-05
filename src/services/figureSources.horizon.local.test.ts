// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { AssessmentResult } from '@/hooks/assessmentTypes'
import { Q_DAY_FRESHNESS, QC_FIRST_YEAR } from '@/data/quantumTimeline'
import { buildFigureSources, figureSourcesCsv, figureSourcesMarkdown } from './figureSources'

const base: AssessmentResult = {
  riskScore: 50,
  riskLevel: 'medium',
  algorithmMigrations: [],
  complianceImpacts: [],
  recommendedActions: [],
  narrative: 'Fictional sample',
  generatedAt: '2026-11-05T00:00:00Z',
  keyFindings: [],
}
const profile = { industry: 'Sample', country: 'Sample', generatedAt: base.generatedAt }
const withYear = (year: number): AssessmentResult => ({
  ...base,
  hndlRiskWindow: {
    currentYear: 2026,
    dataRetentionYears: 10,
    estimatedQuantumThreatYear: year,
    crqcEstimateYear: year,
    isAtRisk: false,
    riskWindowYears: 0,
  },
})

describe('planning-year provenance is not an arrival prediction', () => {
  it.each([QC_FIRST_YEAR, 2035])(
    'retains scenario year %s and exact contextual URL/date in both exports',
    (year) => {
      const result = withYear(year)
      const before = JSON.stringify(result)
      const entries = buildFigureSources({ result, profile })
      const entry = entries.find((item) =>
        item.claim.startsWith('Quantum-threat planning horizon')
      )!
      expect(entry).toMatchObject({
        value: `~${year}`,
        kind: 'scenario',
        source: {
          label: 'Hub quantum-threat planning scenario; related context',
          url: Q_DAY_FRESHNESS.recheck,
        },
        asOf: Q_DAY_FRESHNESS.asOf,
      })
      expect(entry.method).toContain('not a predicted arrival date')
      expect(entry.caveat).toContain('default 2029 anchor is an authored Hub scenario')
      for (const output of [figureSourcesCsv(entries), figureSourcesMarkdown(entries)]) {
        expect(output).toContain(`~${year}`)
        expect(output).toContain(Q_DAY_FRESHNESS.recheck)
        expect(output).toContain(Q_DAY_FRESHNESS.asOf)
        expect(output).toContain('not a predicted arrival date')
        expect(output).not.toContain('inside the published research range')
      }
      expect(JSON.stringify(result)).toBe(before)
    }
  )

  it('omits the horizon when no exposure window supplies one', () => {
    const entries = buildFigureSources({ result: base, profile })
    expect(entries.some((item) => item.claim.startsWith('Quantum-threat planning horizon'))).toBe(
      false
    )
    expect(figureSourcesCsv(entries)).not.toContain('~2029')
  })
})
