// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  BASE_WEIGHTS,
  DIMENSION_APPLICABILITY,
  redistributeWeights,
  getTrustTier,
} from '../weights'
import type { ScoredResourceType } from '../types'

describe('BASE_WEIGHTS', () => {
  it('sums to 1.0', () => {
    const sum = Object.values(BASE_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0, 5)
  })

  it('has exactly 8 dimensions', () => {
    expect(Object.keys(BASE_WEIGHTS)).toHaveLength(8)
  })
})

describe('redistributeWeights', () => {
  const resourceTypes: ScoredResourceType[] = [
    'library',
    'timeline',
    'compliance',
    'migrate',
    'threats',
    'leaders',
    'algorithm',
  ]

  it.each(resourceTypes)('redistributed weights for %s sum to 1.0', (rt) => {
    const dims = DIMENSION_APPLICABILITY[rt]
    const weights = redistributeWeights(dims)
    const sum = Object.values(weights).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0, 5)
  })

  it('returns fewer keys when fewer dimensions apply', () => {
    const leaderWeights = redistributeWeights(DIMENSION_APPLICABILITY.leaders)
    expect(Object.keys(leaderWeights)).toHaveLength(5)
  })
})

describe('getTrustTier', () => {
  it('returns Authoritative for scores >= 85', () => {
    expect(getTrustTier(85)).toBe('Authoritative')
    expect(getTrustTier(100)).toBe('Authoritative')
  })

  it('returns High for scores 70-84', () => {
    expect(getTrustTier(70)).toBe('High')
    expect(getTrustTier(84)).toBe('High')
  })

  it('returns Moderate for scores 50-69', () => {
    expect(getTrustTier(50)).toBe('Moderate')
    expect(getTrustTier(69)).toBe('Moderate')
  })

  it('returns Low for scores < 50', () => {
    expect(getTrustTier(0)).toBe('Low')
    expect(getTrustTier(49)).toBe('Low')
  })
})
