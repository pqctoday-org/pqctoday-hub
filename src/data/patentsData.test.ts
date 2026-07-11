// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { patentsData } from './patentsData'

describe('patentsData — pqc_migration_score honesty', () => {
  it('preserves null for unscored patents instead of coercing to 0', () => {
    const unscored = patentsData.filter((p) => p.pqcMigrationScore === null)
    const zeroScored = patentsData.filter((p) => p.pqcMigrationScore === 0)
    // The corpus is known to have a real population of unscored rows (empty
    // pqc_migration_score in the CSV) — they must surface as null, not 0.
    expect(unscored.length).toBeGreaterThan(0)
    // A patent whose raw score is null must never be indistinguishable from
    // one genuinely scored at 0 by the loader.
    for (const p of unscored) {
      expect(p.pqcMigrationScore).toBeNull()
    }
    for (const p of zeroScored) {
      expect(p.pqcMigrationScore).toBe(0)
    }
  })

  it('parses decimal score strings float-safely', () => {
    const scored = patentsData.filter((p) => p.pqcMigrationScore !== null)
    expect(scored.length).toBeGreaterThan(0)
    for (const p of scored) {
      expect(Number.isFinite(p.pqcMigrationScore)).toBe(true)
    }
  })
})

describe('patentsData — McEliece taxonomy', () => {
  it('never maps a McEliece-family algorithm to the classical status', () => {
    const offenders = patentsData.filter((p) =>
      p.nistRoundStatus.some(
        (n) => n.algorithm.toLowerCase().includes('mceliece') && n.status === 'classical'
      )
    )
    expect(offenders).toEqual([])
  })
})
