// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  FRESHNESS_CLAIMS,
  FRESHNESS_MAX_AGE_DAYS,
  ageInDays,
  staleClaims,
  malformedClaims,
  freshnessReportMarkdown,
  type FreshnessClaim,
} from './contentFreshness'

// A fixed "now" so the suite never depends on the wall clock.
const NOW = new Date('2026-06-18T12:00:00Z')

const claim = (id: string, asOf: string): FreshnessClaim => ({
  id,
  claim: `test ${id}`,
  source: 'test',
  asOf,
  recheck: 'https://example.com/recheck',
})

describe('contentFreshness — staleness math', () => {
  it('ageInDays counts whole days from asOf (UTC midnight) to now', () => {
    expect(ageInDays('2026-06-18', NOW)).toBe(0)
    expect(ageInDays('2026-06-08', NOW)).toBe(10)
    expect(ageInDays('2026-03-10', NOW)).toBe(100)
  })

  it('flags a claim older than the window, not a fresh one', () => {
    const old = claim('old', '2026-03-10') // 100 days before NOW
    const fresh = claim('fresh', '2026-05-20') // 29 days before NOW
    const stale = staleClaims([old, fresh], NOW)
    expect(stale.map((c) => c.id)).toEqual(['old'])
  })

  it('treats exactly the window boundary as still fresh (> maxDays is stale)', () => {
    const atBoundary = claim('boundary', '2026-03-20') // exactly 90 days before NOW
    expect(staleClaims([atBoundary], NOW)).toHaveLength(0)
    expect(ageInDays('2026-03-20', NOW)).toBe(FRESHNESS_MAX_AGE_DAYS)
  })
})

describe('contentFreshness — the live manifest', () => {
  it('is non-empty and aggregates all three sources', () => {
    expect(FRESHNESS_CLAIMS.length).toBeGreaterThanOrEqual(3)
    const sources = new Set(FRESHNESS_CLAIMS.map((c) => c.source))
    expect(sources).toContain('src/data/quantumTimeline.ts')
    expect(sources).toContain('src/data/pqcProtocolMatrix.ts')
    expect(sources).toContain('src/data/simMoves.ts')
  })

  it('every claim is well-formed (ISO asOf + http recheck URL)', () => {
    expect(malformedClaims()).toEqual([])
  })

  it('is sorted by id for a deterministic report', () => {
    const ids = FRESHNESS_CLAIMS.map((c) => c.id)
    expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)))
  })
})

describe('contentFreshness — report', () => {
  it('regenerates deterministically and lists every claim', () => {
    const a = freshnessReportMarkdown()
    const b = freshnessReportMarkdown()
    expect(a).toBe(b)
    for (const c of FRESHNESS_CLAIMS) expect(a).toContain(c.id)
  })
})
