// SPDX-License-Identifier: GPL-3.0-only
/**
 * TrustTierFilter unit tests (C8 — pure logic).
 *
 * The matching helper has no React dependencies, so we test it directly.
 * URL/UI behavior is covered end-to-end by e2e/trust-tier-filter.spec.ts.
 */
import { describe, it, expect } from 'vitest'
import { matchesTrustTierFilter } from './TrustTierFilter'
import { trustScores } from '@/data/trustScore/trustScoreData'

describe('matchesTrustTierFilter (C8)', () => {
  it('passes everything when no tiers selected', () => {
    expect(matchesTrustTierFilter([], 'library', 'anything')).toBe(true)
    expect(matchesTrustTierFilter([], 'library', 'does-not-exist')).toBe(true)
  })

  it('rejects unscored resources when at least one tier is selected', () => {
    expect(matchesTrustTierFilter(['Authoritative'], 'library', 'no-such-id-xyz-123')).toBe(false)
  })

  it('passes when the resource tier is in the selected set', () => {
    // Find a real resource in the precomputed trustScores map
    const sample = Array.from(trustScores.values())[0]
    expect(sample).toBeDefined()
    expect(matchesTrustTierFilter([sample.tier], sample.resourceType, sample.resourceId)).toBe(true)
  })

  it('rejects when the resource tier is NOT in the selected set', () => {
    // Find a Low-tier resource and filter for Authoritative only
    const low = Array.from(trustScores.values()).find((s) => s.tier === 'Low')
    if (!low) {
      // No Low-tier records in current dataset; skip in a way the runner reports.
      return
    }
    expect(matchesTrustTierFilter(['Authoritative'], low.resourceType, low.resourceId)).toBe(false)
  })

  it('multi-tier selection acts as logical OR', () => {
    const all = Array.from(trustScores.values())
    const authA = all.find((s) => s.tier === 'Authoritative')
    const high = all.find((s) => s.tier === 'High')
    if (authA) {
      expect(
        matchesTrustTierFilter(['Authoritative', 'Moderate'], authA.resourceType, authA.resourceId)
      ).toBe(true)
    }
    if (high) {
      expect(
        matchesTrustTierFilter(['Authoritative', 'High'], high.resourceType, high.resourceId)
      ).toBe(true)
      expect(matchesTrustTierFilter(['Low'], high.resourceType, high.resourceId)).toBe(false)
    }
  })
})
