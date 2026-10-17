// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { tierBadge, type AlgorithmStatusTier } from './algorithmStatusTier'
import { loadPQCAlgorithmsData } from './pqcAlgorithmsData'

describe('tierBadge', () => {
  it('gives each non-final tier its own label', () => {
    const expected: Record<AlgorithmStatusTier, string | null> = {
      final: null,
      regional: null,
      'fips-draft': 'Selected; standard pending',
      'sp-draft': 'Draft',
      'ietf-draft': 'Draft',
      'round2-candidate': 'Candidate',
      'round4-not-selected': 'Not selected',
      eliminated: 'Withdrawn or eliminated',
      placeholder: 'Placeholder',
      unverified: 'Not verified',
      'non-standardized': 'Outside a standards track',
    }
    for (const [tier, label] of Object.entries(expected)) {
      expect(tierBadge(tier as AlgorithmStatusTier)?.label ?? null, tier).toBe(label)
    }
  })

  // Withdrawn, broken, not-selected and unverified schemes used to carry a
  // "Draft" badge implying they were on their way to becoming standards.
  it('never labels an inactive catalogue row as a draft or candidate', async () => {
    const data = await loadPQCAlgorithmsData()
    const inactive = data.filter((a) =>
      ['eliminated', 'round4-not-selected', 'unverified', 'non-standardized'].includes(a.statusTier)
    )
    expect(inactive.length).toBeGreaterThan(5)
    for (const algo of inactive) {
      const badge = tierBadge(algo.statusTier)
      expect(badge?.tone, algo.name).toBe('inactive')
      expect(badge?.label, algo.name).not.toMatch(/Draft|Candidate/)
    }
  })
})
