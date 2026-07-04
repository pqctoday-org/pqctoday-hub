// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { reportVerdict, NO_PERSONA_VERDICT } from './reportVerdicts'
import type { AssessmentResult } from '../hooks/assessmentTypes'

function makeResult(overrides: Partial<AssessmentResult> = {}): AssessmentResult {
  return {
    riskScore: 50,
    riskLevel: 'medium',
    algorithmMigrations: [],
    complianceImpacts: [],
    recommendedActions: [],
    narrative: 'neutral narrative',
    generatedAt: new Date(0).toISOString(),
    ...overrides,
  } as AssessmentResult
}

describe('reportVerdict — persona-aware, score-specific text (no static duplicate copy)', () => {
  it('no persona: returns the generic NO_PERSONA_VERDICT regardless of result', () => {
    expect(reportVerdict(null, makeResult())).toEqual(NO_PERSONA_VERDICT)
    expect(reportVerdict(null, null)).toEqual(NO_PERSONA_VERDICT)
  })

  it('persona selected: narrative is the real result.personaNarrative, not a static string', () => {
    const result = makeResult({ personaNarrative: 'This specific org is at critical risk.' })
    const verdict = reportVerdict('executive', result)
    expect(verdict.narrative).toBe('This specific org is at critical risk.')
    expect(verdict.tag).toBe('Executive view')
  })

  it('two different results for the same persona produce different verdict text', () => {
    const low = reportVerdict('architect', makeResult({ personaNarrative: 'Low risk take.' }))
    const high = reportVerdict('architect', makeResult({ personaNarrative: 'Critical risk take.' }))
    expect(low.narrative).not.toBe(high.narrative)
    expect(low.tag).toBe(high.tag) // tag is persona-fixed, not result-dependent
  })

  it('falls back to the neutral narrative when personaNarrative is absent', () => {
    const result = makeResult({ narrative: 'fallback neutral text', personaNarrative: undefined })
    expect(reportVerdict('ops', result).narrative).toBe('fallback neutral text')
  })

  it('falls back to NO_PERSONA_VERDICT narrative when result is null', () => {
    expect(reportVerdict('curious', null).narrative).toBe(NO_PERSONA_VERDICT.narrative)
  })
})
