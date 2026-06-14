// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SIM_MISSIONS } from './simMissions'

describe('simMissions (CSV-backed)', () => {
  it('loads all eight phases p0–p7', () => {
    expect(Object.keys(SIM_MISSIONS).sort()).toEqual([
      'p0',
      'p1',
      'p2',
      'p3',
      'p4',
      'p5',
      'p6',
      'p7',
    ])
  })

  it('each phase has a mission and a goal for every maturity level 0–4', () => {
    for (const [phase, m] of Object.entries(SIM_MISSIONS)) {
      expect(m!.mission.trim().length, `${phase}: empty mission`).toBeGreaterThan(0)
      expect(m!.todo.length, `${phase}: no to-dos`).toBeGreaterThan(0)
      expect(
        Object.keys(m!.levels)
          .map(Number)
          .sort((a, b) => a - b),
        `${phase}: levels`
      ).toEqual([0, 1, 2, 3, 4])
      for (let l = 0; l <= 4; l++) {
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
