// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { isPqcPatent } from '@/components/Patents/patentColumns'
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
    // loader drops them on the raw status column. The 2026-09-22
    // re-enrichment moved 18 of the remaining rows out of isPqcPatent() by
    // re-reading their labels from the patents' own claims — a
    // "quantum-resistant SIM card" whose claims recite AES-256, homomorphic
    // -encryption accelerators, QKD. They are NOT deprecated: AES-256 is
    // quantum-safe (Grover costs a square root, so ~128-bit security, which
    // NIST treats as post-quantum adequate), it is simply not a NIST PQC
    // algorithm. They load, they carry a quantumSafeBasis saying why, and
    // the "All crypto" scope shows them.
    expect(patentsData.length).toBe(729)
    const inScope = patentsData.filter(isPqcPatent)
    expect(inScope.length).toBe(711)
    expect(patentsData.length - inScope.length).toBe(18)
  })
})

describe('patentsData — quantum-safe basis (2026-09-22)', () => {
  it('says WHY a patent outside the PQC scope is still quantum-safe', () => {
    // pqcAlgorithms only ever holds NIST PQC names — AES appears in none of
    // the 1,862 rows — so a patent whose quantum resistance comes from
    // AES-256 (~128-bit security against Grover, which NIST treats as
    // post-quantum adequate), from a lattice FHE scheme, or from QKD read as
    // purely classical and silently left the page. Each now says which.
    const outside = patentsData.filter((p) => !isPqcPatent(p))
    expect(outside.length).toBeGreaterThan(0)
    const explained = outside.filter((p) => p.quantumSafeBasis !== '')
    expect(explained.length).toBe(outside.length - 1) // Code-sign white listing claims none
    for (const p of explained) {
      expect(['symmetric_strength', 'lattice_fhe', 'qkd']).toContain(p.quantumSafeBasis)
    }
    // a patent that names a PQC algorithm is labelled as such, not left blank
    const pqc = patentsData.filter((p) => p.pqcAlgorithms.length > 0)
    expect(pqc.every((p) => p.quantumSafeBasis === 'pqc_algorithm')).toBe(true)
  })

  it('keeps constructions built ON a post-quantum assumption in scope', () => {
    // The 2026-09-22 re-enrichment labelled two of them classical_only with an
    // empty algorithm list while its own summary said "using a
    // learning-with-error (LWE) assumption". LWE and LPN are the
    // post-quantum hardness assumptions; that was a regression, now restored.
    for (const num of ['US11101991', 'US20220405372']) {
      const p = patentsData.find((x) => x.patentNumber === num)
      expect(p, `${num} missing`).toBeTruthy()
      expect(isPqcPatent(p!)).toBe(true)
      expect(p!.pqcAlgorithms.length).toBeGreaterThan(0)
    }
  })
})
