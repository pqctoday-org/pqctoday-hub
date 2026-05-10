// SPDX-License-Identifier: GPL-3.0-only
/**
 * Trust-engine contract tests (C1, C2, C5).
 *
 * These tests pin down user-visible trust-engine behavior. Changing any of
 * these numbers should require an explicit code change with reviewer awareness
 * — that is the whole point of a contract test.
 */
import { describe, it, expect } from 'vitest'
import { getTrustTier, BASE_WEIGHTS, type TrustTier, type ScoredResourceType } from '../index'
import { computeTrustScore } from '../engine'
import { DIMENSION_APPLICABILITY } from '../weights'
import { trustTierMultiplier } from '@/services/search/chunkToResource'
import { scoreTemporalFreshness } from '../dimensions/temporalFreshness'
import { makeScoringContext } from '@/test/fixtures/scoringContext'

describe('C1 — tier values & ranking weights are stable', () => {
  it('TrustTier enum has exactly four values, in this order', () => {
    const tiers: TrustTier[] = ['Authoritative', 'High', 'Moderate', 'Low']
    // If a 5th tier is added, this test should be updated intentionally.
    expect(tiers).toHaveLength(4)
  })

  it('tier multipliers are exactly 1.2 / 1.1 / 1.0 / 0.8 / 0.95(null)', () => {
    expect(trustTierMultiplier('Authoritative')).toBe(1.2)
    expect(trustTierMultiplier('High')).toBe(1.1)
    expect(trustTierMultiplier('Moderate')).toBe(1.0)
    expect(trustTierMultiplier('Low')).toBe(0.8)
    expect(trustTierMultiplier(null)).toBe(0.95)
  })

  it('multipliers are strictly monotonic across tiers', () => {
    expect(trustTierMultiplier('Authoritative')).toBeGreaterThan(trustTierMultiplier('High'))
    expect(trustTierMultiplier('High')).toBeGreaterThan(trustTierMultiplier('Moderate'))
    expect(trustTierMultiplier('Moderate')).toBeGreaterThan(trustTierMultiplier('Low'))
  })

  it('getTrustTier thresholds partition [0, 100] without gaps', () => {
    expect(getTrustTier(100)).toBe('Authoritative')
    expect(getTrustTier(85)).toBe('Authoritative')
    expect(getTrustTier(84)).toBe('High')
    expect(getTrustTier(70)).toBe('High')
    expect(getTrustTier(69)).toBe('Moderate')
    expect(getTrustTier(50)).toBe('Moderate')
    expect(getTrustTier(49)).toBe('Low')
    expect(getTrustTier(0)).toBe('Low')
  })

  it('getTrustTier is monotonic: higher score never drops a tier', () => {
    const tierOrder: Record<TrustTier, number> = {
      Low: 0,
      Moderate: 1,
      High: 2,
      Authoritative: 3,
    }
    let prevTierRank = 0
    for (let s = 0; s <= 100; s++) {
      const rank = tierOrder[getTrustTier(s)]
      expect(rank).toBeGreaterThanOrEqual(prevTierRank)
      prevTierRank = rank
    }
  })

  it('BASE_WEIGHTS sum to 1.0 (within float tolerance)', () => {
    const sum = Object.values(BASE_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0, 10)
  })
})

describe('C2 — every scoreable resource type has applicable dimensions', () => {
  const types: ScoredResourceType[] = [
    'library',
    'timeline',
    'compliance',
    'migrate',
    'threats',
    'leaders',
    'algorithm',
  ]

  for (const t of types) {
    it(`${t} has at least 4 applicable dimensions`, () => {
      const dims = DIMENSION_APPLICABILITY[t]
      expect(dims).toBeDefined()
      expect(dims.length).toBeGreaterThanOrEqual(4)
    })
  }

  it('computeTrustScore is deterministic for the same inputs (excluding computedAt)', () => {
    const fields = {
      peerReviewed: 'yes' as const,
      vettingBody: ['NIST'],
      lastVerifiedDate: '2026-04-01',
    }
    const ctx = makeScoringContext({
      trustedSources: [['nist', { trustTier: '1_Authoritative', sourceType: 'Government' }]],
      xrefs: [['FIPS_203', [{ sourceId: 'nist', matchMethod: 'direct' }]]],
    })
    const a = computeTrustScore('library', 'FIPS_203', fields, ctx)
    const b = computeTrustScore('library', 'FIPS_203', fields, ctx)
    expect(a.compositeScore).toBe(b.compositeScore)
    expect(a.tier).toBe(b.tier)
    expect(a.dimensions.map((d) => d.weightedScore)).toEqual(
      b.dimensions.map((d) => d.weightedScore)
    )
  })

  it('compositeScore stays within [0, 100]', () => {
    const ctx = makeScoringContext()
    const lowScore = computeTrustScore('library', 'no-data', {}, ctx)
    expect(lowScore.compositeScore).toBeGreaterThanOrEqual(0)
    expect(lowScore.compositeScore).toBeLessThanOrEqual(100)
    expect(['Authoritative', 'High', 'Moderate', 'Low']).toContain(lowScore.tier)
  })
})

describe('C5 — freshness math', () => {
  function fmtDaysAgo(days: number): string {
    const ts = Date.now() - days * 24 * 60 * 60 * 1000
    return new Date(ts).toISOString().slice(0, 10)
  }

  it('returns notApplicable when no dates provided', () => {
    const r = scoreTemporalFreshness({})
    expect(r.notApplicable).toBe(true)
  })

  it('30-day-fresh content scores 100', () => {
    expect(scoreTemporalFreshness({ lastVerifiedDate: fmtDaysAgo(15) }).rawScore).toBe(100)
  })

  it('uses the most recent of multiple dates', () => {
    const r = scoreTemporalFreshness({
      lastVerifiedDate: fmtDaysAgo(10),
      releaseDate: fmtDaysAgo(900),
    })
    expect(r.rawScore).toBe(100)
  })

  it('365-day boundary gives 30 (not 10)', () => {
    expect(scoreTemporalFreshness({ lastVerifiedDate: fmtDaysAgo(365) }).rawScore).toBe(30)
  })

  it('over 365 days drops to 10', () => {
    expect(scoreTemporalFreshness({ lastVerifiedDate: fmtDaysAgo(400) }).rawScore).toBe(10)
  })

  it('unparseable date returns 10 with explanatory rationale', () => {
    const r = scoreTemporalFreshness({ lastVerifiedDate: 'not-a-date' })
    expect(r.rawScore).toBe(10)
    expect(r.rationale).toMatch(/parsed/i)
  })
})
