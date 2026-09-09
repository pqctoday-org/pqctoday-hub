// SPDX-License-Identifier: GPL-3.0-only
/**
 * W7.1/W7.3 — the introductory journey is short because it is MEASURED short.
 *
 * The audit found the shortest way in was the ~45-minute overview, which is a
 * lot to ask before a learner knows whether any of this concerns them. The
 * plan also asks that time estimates be calibrated rather than advertised, so
 * this queue is bounded by the same estimator every other mode reports with.
 */
import { describe, it, expect } from 'vitest'
import { autoRunIntroQueue, estimatedMinutes, INTRO_BUDGET_MINUTES } from './simAutoRun'
import { autoRunWalkthroughQueue } from './simAutoRun'
import { isGatingStep } from '@/simulation'

describe('the introductory journey (W7.1)', () => {
  it('exists and is not empty', () => {
    expect(autoRunIntroQueue().length).toBeGreaterThan(0)
  })

  it('stays inside its stated budget, measured by the real estimator', () => {
    const mins = estimatedMinutes(autoRunIntroQueue().map((i) => i.step))
    expect(mins).toBeGreaterThan(0)
    expect(mins).toBeLessThanOrEqual(INTRO_BUDGET_MINUTES)
  })

  it('is dramatically shorter than the overview it gives an alternative to', () => {
    const intro = estimatedMinutes(autoRunIntroQueue().map((i) => i.step))
    const overview = estimatedMinutes(autoRunWalkthroughQueue(false).map((i) => i.step))
    expect(intro).toBeLessThan(overview / 2)
  })

  it('honours a smaller budget rather than ignoring it', () => {
    const small = estimatedMinutes(autoRunIntroQueue(4).map((i) => i.step))
    expect(small).toBeLessThanOrEqual(4)
  })

  it('uses only real, gating tree steps — no invented content', () => {
    for (const item of autoRunIntroQueue()) {
      expect(isGatingStep(item.step)).toBe(true)
      expect(item.step.to.startsWith('/')).toBe(true)
      expect(['learn', 'reference']).toContain(item.step.kind)
    }
  })

  it('does not repeat the same resource twice', () => {
    const tos = autoRunIntroQueue().map((i) => i.step.to)
    expect(new Set(tos).size).toBe(tos.length)
  })
})
