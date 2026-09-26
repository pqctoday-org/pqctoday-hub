// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for `autoRunPhaseQueue` (Play This Phase's real engine queue) and
 * `isPhaseMode` — the follow-up to `simulation-unified-play-mechanism-plan-
 * 07052026.md` that replaced Play This Phase's v1 board deep-link with a
 * genuine narrated auto-run scoped to one phase. Per repo convention, this
 * suite is local-only (`.local.test.ts`), not added to CI.
 */
import { describe, it, expect } from 'vitest'
import {
  autoRunPhaseQueue,
  gatingStepsForPhaseLevel,
  stepDedupeKey,
  stepsForPhase,
} from './simAutoRun'
import { isPhaseMode, isWalkthroughMode } from './useSimAutoRunPlayer'
import { isGatingStep, type TreeStep } from '@/simulation'

describe('autoRunPhaseQueue', () => {
  // FIXED 2026-09-25. This used to assert `queue.length === flat.length`, which
  // was never the contract. `autoRunPhaseQueue` deduplicates by
  // `stepDedupeKey` (kind + resource id) and has since it was written;
  // `stepsForPhase` does not dedupe at all. The two agree only while no phase
  // references one resource from two maturity bands — and authored content does
  // that on purpose, in 5 of the 7 phases. p6 is the case here: L-band framing
  // re-introduces `/algorithms?tab=detailed` and the `hsm-capacity` workshop with
  // different labels ("Reference: detailed algorithm comparison — the size and
  // performance constraints infrastructure has to absorb" vs "Reference: detailed
  // algorithm size comparison"). An auto-run must drive each resource once, so
  // the dedupe is right and the equality was wrong.
  //
  // What matters is COVERAGE (no gating resource silently dropped from the run)
  // and NO REPEAT. Both are asserted below, which is strictly more than a length
  // comparison ever checked — a length match cannot tell a dropped step from a
  // duplicated one.
  const keyed = (steps: TreeStep[]) =>
    steps.map(stepDedupeKey).filter((k): k is string => k !== null)
  const unkeyed = (steps: TreeStep[]) => steps.filter((s) => stepDedupeKey(s) === null).length

  it('covers every distinct gating resource of the phase exactly once, tagged with the right phase/level', () => {
    const queue = autoRunPhaseQueue('p6', false)
    const flat = stepsForPhase('p6', false)

    const queueKeys = keyed(queue.map((it) => it.step))
    // NO REPEAT — a deduplicated resource must appear once.
    expect(new Set(queueKeys).size, `queue repeats a resource: ${queueKeys.join(', ')}`).toBe(
      queueKeys.length
    )
    // COVERAGE — every distinct gating resource of the phase is still in the run.
    expect([...new Set(queueKeys)].sort()).toEqual([...new Set(keyed(flat))].sort())
    // Steps with no shared completion predicate are never deduplicated, so all
    // of them survive; together with the two above this fixes queue.length.
    expect(unkeyed(queue.map((it) => it.step))).toBe(unkeyed(flat))
    expect(queue.length).toBe(new Set(queueKeys).size + unkeyed(flat))

    for (const item of queue) {
      expect(item.phase).toBe('p6')
      expect(isGatingStep(item.step)).toBe(true)
      expect(gatingStepsForPhaseLevel('p6', item.level).some((s) => s.to === item.step.to)).toBe(
        true
      )
    }
  })

  it('p6 really does reference a resource from two bands — the reason dedupe exists', () => {
    // Pins the premise of the test above. If this ever stops being true the
    // coverage assertion degenerates into a tautology, and whoever removed the
    // repeat should know they did.
    const flat = stepsForPhase('p6', false)
    expect(new Set(keyed(flat)).size + unkeyed(flat)).toBeLessThan(flat.length)
  })

  it('is a strict superset when includeDeepDive is true (p6 has authored deep-dive content)', () => {
    const standard = autoRunPhaseQueue('p6', false)
    const deep = autoRunPhaseQueue('p6', true)
    expect(deep.length).toBeGreaterThan(standard.length)
    const standardTos = new Set(standard.map((it) => it.step.to))
    for (const it of deep.filter((it) => !standardTos.has(it.step.to))) {
      expect(it.step.optional).toBe(true)
    }
  })

  it('levels are non-decreasing (level-major, same invariant as autoRunQueue)', () => {
    const queue = autoRunPhaseQueue('p6', true)
    let last = 0
    for (const item of queue) {
      expect(item.level).toBeGreaterThanOrEqual(last)
      last = item.level
    }
  })
})

describe('isPhaseMode', () => {
  it('is true for phase and phase-deep, false for every other RunMode', () => {
    expect(isPhaseMode('phase')).toBe(true)
    expect(isPhaseMode('phase-deep')).toBe(true)
    expect(isPhaseMode('climb')).toBe(false)
    expect(isPhaseMode('climb-deep')).toBe(false)
    expect(isPhaseMode('walkthrough')).toBe(false)
    expect(isPhaseMode('walkthrough-deep')).toBe(false)
  })

  it('is mutually exclusive with isWalkthroughMode for every mode', () => {
    const modes = ['climb', 'climb-deep', 'walkthrough', 'walkthrough-deep', 'phase', 'phase-deep']
    for (const m of modes) {
      const runMode = m as Parameters<typeof isPhaseMode>[0]
      expect(isPhaseMode(runMode) && isWalkthroughMode(runMode)).toBe(false)
    }
  })
})
