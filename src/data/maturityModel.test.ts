// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { deriveMaturity, MATURITY_DOMAINS, DOMAIN_TO_PHASES } from './maturityModel'
import type { PhaseId } from './frameworkPhases'

// All phases referenced by any domain — used to build a "raise everything" map.
const ALL_PHASES = Array.from(
  new Set(MATURITY_DOMAINS.flatMap((d) => DOMAIN_TO_PHASES[d.id]))
) as PhaseId[]

/** A phase→level lookup from a map, defaulting to 0 for anything unset. */
const lookup =
  (levels: Partial<Record<PhaseId, number>>) =>
  (p: PhaseId): number =>
    // eslint-disable-next-line security/detect-object-injection
    levels[p] ?? 0

describe('deriveMaturity', () => {
  it('no assessment, no progress → overall 0 (Unaware), every domain 0', () => {
    const m = deriveMaturity(false, () => 0)
    expect(m.overall).toBe(0)
    for (const d of MATURITY_DOMAINS) expect(m.scores[d.id]).toBe(0)
    // every domain is at the minimum → all are gating
    expect(m.gating.length).toBe(MATURITY_DOMAINS.length)
  })

  it('assessed but no sim progress → overall 1 (Aware), every domain 1', () => {
    const m = deriveMaturity(true, () => 0)
    expect(m.overall).toBe(1)
    for (const d of MATURITY_DOMAINS) expect(m.scores[d.id]).toBe(1)
  })

  it('earned levels override the aware base when higher (max of aware vs earned)', () => {
    // assessed (aware base 1) but every phase earned to level 3
    const m = deriveMaturity(true, () => 3)
    expect(m.overall).toBe(3)
    for (const d of MATURITY_DOMAINS) expect(m.scores[d.id]).toBe(3)
  })

  it('raising all mapped phases makes the overall climb', () => {
    const at = (n: number) => deriveMaturity(true, () => n)
    expect(at(1).overall).toBe(1)
    expect(at(2).overall).toBe(2)
    expect(at(3).overall).toBe(3)
  })

  it('overall = the weakest domain — one weak phase pins it', () => {
    // Raise every phase to 4 EXCEPT p7 (vendor), left at 0.
    const levels: Partial<Record<PhaseId, number>> = {}
    for (const p of ALL_PHASES) levels[p] = 4
    levels.p7 = 0
    const m = deriveMaturity(true, lookup(levels))
    // vendor maps to [p7] → earned min 0 → max(aware 1, 0) = 1
    expect(m.scores.vendor).toBe(1)
    expect(m.overall).toBe(1)
    expect(m.gating).toEqual(['vendor'])
  })

  it('a domain takes the WEAKEST of its mapped phases', () => {
    // inventory maps to [p1, p2]: p1 high, p2 low → domain takes the low one.
    const levels: Partial<Record<PhaseId, number>> = {}
    for (const p of ALL_PHASES) levels[p] = 4
    levels.p2 = 2
    const m = deriveMaturity(true, lookup(levels))
    expect(m.scores.inventory).toBe(2)
  })

  it('overall = 5 ONLY when every domain is at 4', () => {
    // every phase at 4 → every domain at 4 → special-cased to overall 5
    const all4 = deriveMaturity(true, () => 4)
    for (const d of MATURITY_DOMAINS) expect(all4.scores[d.id]).toBe(4)
    expect(all4.overall).toBe(5)

    // drop a single domain below 4 → no longer the all-advanced special case;
    // overall falls back to the weakest domain, not 5.
    const levels: Partial<Record<PhaseId, number>> = {}
    for (const p of ALL_PHASES) levels[p] = 4
    levels.p5 = 3 // pilots maps to [p5]
    const notAll = deriveMaturity(true, lookup(levels))
    expect(notAll.scores.pilots).toBe(3)
    expect(notAll.overall).toBe(3)
  })
})
