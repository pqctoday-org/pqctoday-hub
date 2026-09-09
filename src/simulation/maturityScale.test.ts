// SPDX-License-Identifier: GPL-3.0-only
/**
 * W2.3 — framework maturity and scenario completion are different numbers.
 *
 * The suite this replaces asserted `normalizeLevel(2, 2, 4) === 4`: a phase
 * that ships only L1–L2 reported framework level 4 once cleared. That was the
 * level-inflation defect written down as an expectation, so it had to change
 * with the behaviour rather than be preserved.
 */
import { describe, it, expect } from 'vitest'
import {
  topBandLevel,
  frameworkLevel,
  scenarioCompletionFraction,
  hasShortenedLadder,
} from './maturityScale'
import { SIM_TREES } from './index'
import type { PhaseTree } from './types'
import { coverageFor } from './frameworkCoverage'

const tree = (levels: number[]): PhaseTree => ({
  phase: 'p1',
  generated: '00000000',
  source: 'test',
  levels: levels.map((level) => ({ level: level as 1, indicator: 'x', activities: [] })),
  pitfalls: [],
})

describe('topBandLevel', () => {
  it('is the highest band a tree ships', () => {
    expect(topBandLevel(tree([1, 2]), 4)).toBe(2)
    expect(topBandLevel(tree([2, 3]), 4)).toBe(3)
    expect(topBandLevel(tree([1, 2, 3, 4]), 4)).toBe(4)
  })
  it('falls back when there is no tree / no levels', () => {
    expect(topBandLevel(undefined, 4)).toBe(4)
    expect(topBandLevel(tree([]), 4)).toBe(4)
  })
  it('reports what the SIMULATOR ships — every phase now reaches the framework top band', () => {
    // Before W2.4 these read 2 and 3: P3 shipped only L1-L2 and P6 only L2-L3,
    // which is what made a cleared P3 report as fully mature once the achieved
    // level was rescaled against that short ladder.
    expect(topBandLevel(SIM_TREES.p3, 4)).toBe(4)
    expect(topBandLevel(SIM_TREES.p6, 4)).toBe(4)
    expect(topBandLevel(SIM_TREES.p4, 4)).toBe(4)
  })
})

describe('frameworkLevel — never rescaled against our own ladder', () => {
  it('P3 at L2 is framework level 2, NOT 4', () => {
    // The defect: a phase shipping L1-L2 read as fully mature once cleared,
    // silently skipping the framework's own L3 and L4 criteria.
    expect(frameworkLevel(2, 4)).toBe(2)
  })
  it('P6 at L2 is framework level 2, not a stretched 3', () => {
    expect(frameworkLevel(2, 4)).toBe(2)
  })
  it('clamps to the ladder without inflating', () => {
    expect(frameworkLevel(5, 4)).toBe(4)
    expect(frameworkLevel(-1, 4)).toBe(0)
    expect(frameworkLevel(4, 4)).toBe(4)
  })
})

describe('scenarioCompletionFraction — completion, explicitly not maturity', () => {
  it('a fully-cleared phase contributes 1 regardless of ladder length', () => {
    expect(scenarioCompletionFraction(2, 2)).toBe(1)
    expect(scenarioCompletionFraction(3, 3)).toBe(1)
    expect(scenarioCompletionFraction(4, 4)).toBe(1)
  })
  it('partial progress is the level over the top band', () => {
    expect(scenarioCompletionFraction(1, 2)).toBe(0.5)
    expect(scenarioCompletionFraction(0, 4)).toBe(0)
  })
  it('guards top=0', () => {
    expect(scenarioCompletionFraction(1, 0)).toBe(0)
  })
})

describe('shortened ladders are detectable, and match the coverage manifest', () => {
  it('reports no shortened ladder now that every phase ships L1-L4', () => {
    for (const phase of ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] as const) {
      expect(hasShortenedLadder(SIM_TREES[phase], 4), phase).toBe(false)
    }
  })

  it('the manifest and the runtime trees tell the same story', () => {
    // Whatever the trees ship, the manifest must agree: a band that exists is
    // never recorded as unsupported, and a band that does not exist is never
    // recorded as practisable.
    for (const phase of ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'] as const) {
      const top = topBandLevel(SIM_TREES[phase], 4)
      for (const level of [1, 2, 3, 4] as const) {
        const status = coverageFor(phase, level)?.status
        if (level <= top) expect(status, `${phase}/L${level}`).not.toBe('unsupported')
        else expect(status, `${phase}/L${level}`).toBe('unsupported')
      }
    }
  })
})
