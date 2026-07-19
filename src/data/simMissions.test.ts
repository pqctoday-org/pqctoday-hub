// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SIM_MISSIONS } from './simMissions'

describe('simMissions (CSV-backed)', () => {
  it('loads all ten phases p0–p7, foundations and verify-close', () => {
    // 07182026: foundations and verify-close previously had no mission rows —
    // the terminal, ceremony-gating phase rendered an empty mission line. See
    // simulation-mode-review-07182026.md finding I6.
    expect(Object.keys(SIM_MISSIONS).sort()).toEqual([
      'foundations',
      'p0',
      'p1',
      'p2',
      'p3',
      'p4',
      'p5',
      'p6',
      'p7',
      'verify-close',
    ])
  })

  it('each phase has a mission and a goal for every maturity level 0–4', () => {
    // p6 is the one deliberate exception: its framework activities cap at
    // Level 3 (gen-sim-trees.mjs's own comment documents that a candidate
    // Level-4 activity was drafted, then reverted after frameworkFidelity.test.ts
    // correctly rejected it as non-framework-sourced — the Applied Quantum
    // Framework v2.1 defines no real p6 activity beyond 6.5). Keeping a Level-4
    // mission row here would assert a goal the sim can never actually award, so
    // it was dropped (07182026 r1) rather than left as a standing false promise.
    for (const [phase, m] of Object.entries(SIM_MISSIONS)) {
      const expectedLevels = phase === 'p6' ? [0, 1, 2, 3] : [0, 1, 2, 3, 4]
      expect(m!.mission.trim().length, `${phase}: empty mission`).toBeGreaterThan(0)
      expect(m!.todo.length, `${phase}: no to-dos`).toBeGreaterThan(0)
      expect(
        Object.keys(m!.levels)
          .map(Number)
          .sort((a, b) => a - b),
        `${phase}: levels`
      ).toEqual(expectedLevels)
      for (const l of expectedLevels) {
        expect(m!.levels[l].goal.trim().length, `${phase} L${l}: empty goal`).toBeGreaterThan(0)
      }
    }
  })

  it('parses list fields (todo/produces) from the pipe-delimited CSV', () => {
    const p0 = SIM_MISSIONS.p0!
    expect(p0.todo.length).toBeGreaterThan(1)
    expect(p0.produces.length).toBeGreaterThan(1)
    expect(p0.levels[2].name).toBe('Initiated')
  })
})
