// SPDX-License-Identifier: AGPL-3.0-only
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
  it('no persona and no result: returns the generic NO_PERSONA_VERDICT', () => {
    expect(reportVerdict(null, null)).toEqual(NO_PERSONA_VERDICT)
  })

  it('no persona, with a result: a Summary built from the reported facts, not a copy of the Risk Score text', () => {
    const verdict = reportVerdict(null, makeResult())
    expect(verdict.tag).toBe(NO_PERSONA_VERDICT.tag)
    expect(verdict.narrative).not.toBe('neutral narrative')
    expect(verdict.narrative).not.toBe(NO_PERSONA_VERDICT.narrative)
  })

  it('no persona: the generic summary states no exposure and no deadline', () => {
    const t = NO_PERSONA_VERDICT.narrative
    expect(t).not.toMatch(/Your data faces/i)
    expect(t).not.toMatch(/2030/)
    expect(t).not.toMatch(/clustering/i)
    expect(t).toMatch(/depend on your answers/i)
  })

  it('no persona: reports with and without HNDL exposure and dated-framework facts differ', () => {
    const exposed = reportVerdict(
      null,
      makeResult({
        hndlRiskWindow: { isAtRisk: true } as AssessmentResult['hndlRiskWindow'],
        complianceImpacts: [
          { framework: 'F1', requiresPQC: true, deadline: '2030', notes: '' },
          { framework: 'F2', requiresPQC: true, deadline: '2031', notes: '' },
        ],
      })
    )
    const calm = reportVerdict(
      null,
      makeResult({
        hndlRiskWindow: { isAtRisk: false } as AssessmentResult['hndlRiskWindow'],
        complianceImpacts: [{ framework: 'F3', requiresPQC: false, deadline: 'None', notes: '' }],
      })
    )
    expect(exposed.narrative).not.toBe(calm.narrative)
    expect(exposed.narrative).toMatch(/Harvest-Now-Decrypt-Later is an exposure to investigate/)
    expect(exposed.narrative).toMatch(/2 of your selected frameworks state a PQC expectation/)
    expect(calm.narrative).toMatch(/Harvest-Now-Decrypt-Later is not flagged/)
    expect(calm.narrative).not.toMatch(/state[s]? a PQC expectation/)
    // Neither asserts a deadline cluster or year the answers do not support.
    for (const v of [exposed, calm]) {
      expect(v.narrative).not.toMatch(/2030|clustering/i)
    }
  })

  it('no persona: with no HNDL window and no framework facts, nothing about exposure or dates is asserted', () => {
    const v = reportVerdict(null, makeResult())
    expect(v.narrative).not.toMatch(/Harvest-Now-Decrypt-Later/)
    expect(v.narrative).not.toMatch(/framework/)
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
