// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { patentsData, transformRow } from './patentsData'

describe('patentsData — pqc_migration_score honesty', () => {
  it('preserves null for unscored patents instead of coercing to 0', () => {
    const unscored = patentsData.filter((p) => p.pqcMigrationScore === null)
    const zeroScored = patentsData.filter((p) => p.pqcMigrationScore === 0)
    // Until 2026-09-17 the corpus carried 460 unscored rows; every one was
    // outside the page scope and is deprecated since patents_09172026.csv,
    // so the loaded population may hold none. The invariant is pinned on
    // transformRow directly instead of on a population that no longer exists.
    const raw = { patent_number: '1', pqc_migration_score: '' } as Parameters<
      typeof transformRow
    >[0]
    expect(transformRow(raw)?.pqcMigrationScore).toBeNull()
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

describe('patentsData — lifecycle (patents_09172026.csv prunes the out-of-scope rows)', () => {
  it('loads no deprecated patent and every loaded patent is in the page scope', () => {
    // 1,133 rows outside isPqcPatent() were deprecated on 2026-09-17; the
    // loader drops them on the raw status column, so the "all" scope toggle
    // and the PQC-only default now show the same population.
    expect(patentsData.length).toBe(729)
    for (const p of patentsData) {
      const inScope =
        p.pqcAlgorithms.length > 0 ||
        p.cryptoAgilityMode === 'pqc_only' ||
        p.cryptoAgilityMode === 'hybrid'
      expect(inScope).toBe(true)
    }
  })
})
