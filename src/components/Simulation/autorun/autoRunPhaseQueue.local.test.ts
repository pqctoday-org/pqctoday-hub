// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for `autoRunPhaseQueue` (Play This Phase's real engine queue) and
 * `isPhaseMode` — the follow-up to `simulation-unified-play-mechanism-plan-
 * 07052026.md` that replaced Play This Phase's v1 board deep-link with a
 * genuine narrated auto-run scoped to one phase. Per repo convention, this
 * suite is local-only (`.local.test.ts`), not added to CI.
 */
import { describe, it, expect } from 'vitest'
import { autoRunPhaseQueue, gatingStepsForPhaseLevel, stepsForPhase } from './simAutoRun'
import { isPhaseMode, isWalkthroughMode } from './useSimAutoRunPlayer'
import { isGatingStep } from '@/simulation'

describe('autoRunPhaseQueue', () => {
  it('matches stepsForPhase(phase, false) one-for-one, tagged with the right phase/level', () => {
    const queue = autoRunPhaseQueue('p6', false)
    const flat = stepsForPhase('p6', false)
    expect(queue.length).toBe(flat.length)
    for (const item of queue) {
      expect(item.phase).toBe('p6')
      expect(isGatingStep(item.step)).toBe(true)
      expect(gatingStepsForPhaseLevel('p6', item.level).some((s) => s.to === item.step.to)).toBe(
        true
      )
    }
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
