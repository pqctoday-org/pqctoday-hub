// SPDX-License-Identifier: GPL-3.0-only
/**
 * The point of "how this was calculated" is that it is TRUE. A disclosure that
 * describes a formula the scorer is not running is worse than no disclosure —
 * it converts an opaque number into a confidently wrong explanation.
 *
 * So this test does not check the wording. It reconstructs the score from the
 * disclosure's own rows and asserts it lands on the number the scorer produced,
 * for both weighting paths (an industry with its own weights, and one falling
 * back to the default).
 */
import { describe, it, expect } from 'vitest'
import { riskScoreWorking } from './RiskScoreWorking'
import { computeCompositeScoreWithBoosts } from '../../hooks/assessment/scoring'
import { INDUSTRY_COMPOSITE_WEIGHTS, DEFAULT_COMPOSITE_WEIGHTS } from '../../hooks/assessmentData'
import type { AssessmentResult, AssessmentInput, CategoryScores } from '../../hooks/assessmentTypes'

const CATEGORY_SCORES: CategoryScores = {
  quantumExposure: 72,
  migrationComplexity: 48,
  regulatoryPressure: 61,
  organizationalReadiness: 35,
}

function resultFor(scores: CategoryScores): AssessmentResult {
  // Only the fields the disclosure reads are populated; the rest of
  // AssessmentResult is irrelevant to the arithmetic under test.
  return { categoryScores: scores } as unknown as AssessmentResult
}

function inputFor(industry: string): AssessmentInput {
  // A minimal input that takes no situational-boost branch, so preBoostScore
  // and the composite agree and the comparison isolates the weighted sum.
  return {
    industry,
    dataSensitivity: [],
    dataRetention: [],
    credentialLifetime: [],
    currentCrypto: [],
    complianceRequirements: [],
    infrastructure: [],
    migrationStatus: 'started',
  } as unknown as AssessmentInput
}

describe('riskScoreWorking — the disclosure matches the scorer', () => {
  const industriesWithOwnWeights = Object.keys(INDUSTRY_COMPOSITE_WEIGHTS)

  it('reconstructs the scorer’s pre-boost composite for every weighted industry', () => {
    expect(industriesWithOwnWeights.length).toBeGreaterThan(0)
    for (const industry of industriesWithOwnWeights) {
      const working = riskScoreWorking(resultFor(CATEGORY_SCORES), industry)
      expect(working).not.toBeNull()
      expect(working!.weightSource).toBe('industry')
      const scorer = computeCompositeScoreWithBoosts(CATEGORY_SCORES, inputFor(industry))
      // The scorer rounds and clamps; the disclosure shows the raw weighted sum
      // and says so, then names the rounded figure separately.
      expect(Math.round(working!.base)).toBe(scorer.preBoostScore ?? scorer.score)
    }
  })

  it('falls back to the default weighting and says which one it used', () => {
    const working = riskScoreWorking(resultFor(CATEGORY_SCORES), 'An Industry That Does Not Exist')
    expect(working).not.toBeNull()
    expect(working!.weightSource).toBe('default')
    const expected =
      CATEGORY_SCORES.quantumExposure * DEFAULT_COMPOSITE_WEIGHTS.qe +
      CATEGORY_SCORES.migrationComplexity * DEFAULT_COMPOSITE_WEIGHTS.mc +
      CATEGORY_SCORES.regulatoryPressure * DEFAULT_COMPOSITE_WEIGHTS.rp +
      (100 - CATEGORY_SCORES.organizationalReadiness) * DEFAULT_COMPOSITE_WEIGHTS.or
    expect(working!.base).toBeCloseTo(expected, 6)
  })

  it('counts readiness as a gap, not as a raw score', () => {
    const ready = riskScoreWorking(
      resultFor({ ...CATEGORY_SCORES, organizationalReadiness: 90 }),
      'Finance & Banking'
    )
    const unready = riskScoreWorking(
      resultFor({ ...CATEGORY_SCORES, organizationalReadiness: 10 }),
      'Finance & Banking'
    )
    // Being MORE ready must LOWER the total. A sign error here is exactly the
    // kind of thing a reader would spot on screen and lose trust over.
    expect(ready!.base).toBeLessThan(unready!.base)
    expect(ready!.rows.find((r) => r.label === 'Organizational readiness')?.note).toMatch(/gap/i)
  })

  it('renders nothing for the legacy additive path, which has no breakdown', () => {
    expect(riskScoreWorking({} as AssessmentResult, 'Finance & Banking')).toBeNull()
  })
})
