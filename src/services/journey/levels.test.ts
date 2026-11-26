// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { startHere, startStageForLevel } from './levels'
import { rolePathForPersona } from './rolePaths'

describe('level start points (owner: "1 / 2 / 3 start points")', () => {
  it('maps curious to stage 1, basics to 2, expert to 3', () => {
    expect(startStageForLevel('curious')).toBe(1)
    expect(startStageForLevel('basics')).toBe(2)
    expect(startStageForLevel('expert')).toBe(3)
    expect(startStageForLevel(null)).toBe(1)
  })

  it('points "Start here" at the first open lesson at or after the start stage', () => {
    const path = rolePathForPersona('architect')!.parts
    const none = () => false
    for (const [level, stage] of [
      ['curious', 1],
      ['basics', 2],
      ['expert', 3],
    ] as const) {
      const here = startHere(path, level, none)
      expect(here).not.toBeNull()
      expect(here!.stage).toBeGreaterThanOrEqual(
        Math.min(stage, Math.max(...path.map((l) => l.stage)))
      )
      expect(path.filter((l) => l.stage >= stage)[0]).toBe(here)
    }
  })

  it('skips done lessons, and falls back to the first open lesson when the later ones are done', () => {
    const path = rolePathForPersona('architect')!.parts
    const doneAll = new Set(path.filter((l) => l.stage >= 3).map((l) => l.lmId))
    const here = startHere(path, 'expert', (t) => doneAll.has(t))
    expect(here).not.toBeNull()
    expect(here!.stage).toBeLessThan(3)
    expect(startHere(path, 'expert', () => true)).toBeNull()
  })

  it('never hides a lesson: it only chooses one', () => {
    const path = rolePathForPersona('executive')!.parts
    expect(startHere(path, 'expert', () => false)).not.toBeNull()
    expect(path.length).toBe(rolePathForPersona('executive')!.total)
  })
})
