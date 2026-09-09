// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for the Extended Migration Journey queue (`autoRunDeepQueue`), the
 * single-phase step helper (`stepsForPhase`), and the duration-estimate helper
 * (`estimatedMinutes`) — the engine additions from
 * simulation-unified-play-mechanism-plan-07052026.md.
 */
import { SIM_TREES } from '@/simulation'
import { describe, it, expect } from 'vitest'
import {
  autoRunQueue,
  autoRunDeepQueue,
  deepDiveStepsForPhaseLevel,
  gatingStepsForPhaseLevel,
  estimatedMinutes,
  stepsForPhase,
} from './simAutoRun'
import { isGatingStep } from '@/simulation'

describe('autoRunDeepQueue — Extended Migration Journey', () => {
  const climb = autoRunQueue()
  const deep = autoRunDeepQueue()

  it('is a strict superset of autoRunQueue (p6 alone contributes several deep-dive steps today)', () => {
    expect(deep.length).toBeGreaterThan(climb.length)
    const climbKeys = new Set(climb.map((it) => `${it.phase}:${it.level}:${it.step.to}`))
    for (const key of climbKeys) {
      expect(deep.some((it) => `${it.phase}:${it.level}:${it.step.to}` === key)).toBe(true)
    }
  })

  it('every added item is stamped optional and is never a gating step', () => {
    const climbTos = new Set(climb.map((it) => it.step.to))
    const added = deep.filter((it) => !climbTos.has(it.step.to))
    expect(added.length).toBeGreaterThan(0)
    for (const it of added) {
      expect(it.step.optional, `${it.step.to} should be optional`).toBe(true)
      expect(isGatingStep(it.step), `${it.step.to} should not be a gating step`).toBe(false)
    }
  })

  it('is still level-major (non-decreasing levels), same invariant as autoRunQueue', () => {
    let last = 0
    for (const item of deep) {
      expect(item.level).toBeGreaterThanOrEqual(last)
      last = item.level
    }
  })

  it('p6 deep-dive steps appear in the p6 band they were authored into', () => {
    const p6Deep = deepDiveStepsForPhaseLevel('p6', 2)
    expect(p6Deep.length).toBeGreaterThan(0)
    for (const s of p6Deep) {
      expect(
        deep.some((it) => it.phase === 'p6' && it.level === 2 && it.step.to === s.to),
        `${s.to} missing from the deep queue at p6/L2`
      ).toBe(true)
    }
  })
})

describe('stepsForPhase', () => {
  it('excludes deep-dive steps when includeDeepDive is false', () => {
    const standard = stepsForPhase('p6', false)
    const deep = stepsForPhase('p6', true)
    expect(deep.length).toBeGreaterThan(standard.length)
    expect(standard.every((s) => !s.optional)).toBe(true)
  })

  it('matches gatingStepsForPhaseLevel summed across all of a phase’s bands', () => {
    // Derive the band levels from the tree rather than hardcoding them: this
    // read [2, 3], which silently went stale the moment P6 gained its L1 and
    // L4 bands in W2.4.
    const standard = stepsForPhase('p6', false)
    const levels = (SIM_TREES.p6?.levels ?? []).map((b) => b.level)
    const expected = levels.flatMap((lvl) => gatingStepsForPhaseLevel('p6', lvl))
    expect(levels.length).toBeGreaterThan(0)
    expect(standard.length).toBe(expected.length)
  })
})

describe('estimatedMinutes', () => {
  it('weights workshop steps higher than reference steps', () => {
    const workshopMin = estimatedMinutes([
      { kind: 'workshop', label: 'x', to: '/playground/x', workshopId: 'x' },
    ])
    const referenceMin = estimatedMinutes([
      { kind: 'reference', label: 'x', to: '/algorithms', refId: 'x' },
    ])
    expect(workshopMin).toBeGreaterThan(referenceMin)
  })

  it('sums linearly across a mixed set of steps', () => {
    const one = estimatedMinutes([{ kind: 'learn', label: 'x', to: '/learn/x', moduleId: 'x' }])
    const two = estimatedMinutes([
      { kind: 'learn', label: 'x', to: '/learn/x', moduleId: 'x' },
      { kind: 'learn', label: 'y', to: '/learn/y', moduleId: 'y' },
    ])
    expect(two).toBe(one * 2)
  })

  it('returns 0 for an empty step list', () => {
    expect(estimatedMinutes([])).toBe(0)
  })
})
