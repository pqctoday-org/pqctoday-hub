// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  PHASE_MATURITY,
  MATURITY_LEVEL_NAMES,
  PHASE_WIN_LEVEL,
  LEVEL_EVIDENCE,
} from './phaseMaturity'

describe('phaseMaturity', () => {
  it('every defined phase has exactly levels 0–4 with non-empty indicators', () => {
    for (const [phase, ladder] of Object.entries(PHASE_MATURITY)) {
      expect(ladder, `${phase}: missing ladder`).toBeDefined()
      expect(
        ladder!.map((l) => l.level),
        `${phase}: wrong levels`
      ).toEqual([0, 1, 2, 3, 4])
      for (const l of ladder!) {
        expect(l.indicator.trim().length, `${phase} L${l.level}: empty indicator`).toBeGreaterThan(
          0
        )
      }
    }
  })

  it('covers all eight lifecycle phases p0–p7', () => {
    expect(Object.keys(PHASE_MATURITY).sort()).toEqual([
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

  it('has five level names and a valid win level', () => {
    expect(MATURITY_LEVEL_NAMES).toHaveLength(5)
    expect(PHASE_WIN_LEVEL).toBeGreaterThanOrEqual(0)
    expect(PHASE_WIN_LEVEL).toBeLessThanOrEqual(4)
  })

  it('every gated phase has artifact evidence at the win level', () => {
    for (const phase of Object.keys(PHASE_MATURITY)) {
      const ev = LEVEL_EVIDENCE[phase as keyof typeof LEVEL_EVIDENCE]
      expect(
        ev?.[PHASE_WIN_LEVEL]?.length,
        `${phase}: missing L${PHASE_WIN_LEVEL} evidence`
      ).toBeGreaterThan(0)
    }
  })
})
