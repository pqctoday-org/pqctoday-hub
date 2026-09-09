// SPDX-License-Identifier: GPL-3.0-only
/**
 * W7.2/W7.3 — a chapter states what it costs, what it produces, and ends by
 * asking the learner to account for a change.
 *
 * The passes were already resumable and already carried an objective. What they
 * lacked was the other three things the plan asked for, and in particular an
 * effort figure derived from the pass's own steps rather than advertised.
 */
import { describe, it, expect } from 'vitest'
import { passIntroForTest } from './useSimAutoRunPlayer'
import { getScenario } from './scenarioConfig'
import { estimatedMinutes, gatingStepsForPhaseLevel } from './simAutoRun'
import { PHASE_ORDER } from '@/data/frameworkPhases'
import { SIM_TREES } from '@/simulation'

const scenario = getScenario('US')

describe('resumable chapters (W7.2)', () => {
  it('every pass carries an objective, an effort figure, evidence and a reflection', () => {
    for (const level of [1, 2, 3, 4]) {
      const p = passIntroForTest(level, scenario)
      expect(p.summary.length, `L${level} objective`).toBeGreaterThan(10)
      expect(p.effortMinutes, `L${level} effort`).toBeGreaterThan(0)
      expect(p.evidence.length, `L${level} evidence`).toBeGreaterThan(5)
      expect(p.reflection, `L${level} reflection`).toMatch(/\?$/)
    }
  })

  it('effort is MEASURED from the pass’s own steps, not asserted', () => {
    for (const level of [1, 2, 3, 4]) {
      const steps = PHASE_ORDER.filter((ph) => !!SIM_TREES[ph]).flatMap((ph) =>
        gatingStepsForPhaseLevel(ph, level)
      )
      expect(passIntroForTest(level, scenario).effortMinutes).toBe(estimatedMinutes(steps))
    }
  })

  it('reflections ask the learner to account for a change, not to rate themselves', () => {
    const all = [1, 2, 3, 4].map((l) => passIntroForTest(l, scenario).reflection)
    // distinct per chapter — not one prompt repeated
    expect(new Set(all).size).toBe(4)
    // none of them ask for a confidence score
    for (const r of all) expect(r).not.toMatch(/confiden|how well|rate yourself/i)
  })

  it('names the evidence a pass actually produces', () => {
    // A pass whose steps include artifact-producing activities must say so.
    const withArtifacts = [1, 2, 3, 4].filter((level) =>
      PHASE_ORDER.filter((ph) => !!SIM_TREES[ph])
        .flatMap((ph) => gatingStepsForPhaseLevel(ph, level))
        .some((st) => st.kind === 'activity')
    )
    expect(withArtifacts.length).toBeGreaterThan(0)
    for (const level of withArtifacts) {
      expect(passIntroForTest(level, scenario).evidence).toMatch(/documents you produce/)
    }
  })
})
