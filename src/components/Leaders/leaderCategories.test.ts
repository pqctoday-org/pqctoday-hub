// SPDX-License-Identifier: GPL-3.0-only
/**
 * The category list is what the page filters by and what `?cat=` takes — and
 * what the PQC Assistant names in its links (promptBuilder.ts). It once stopped
 * at seven while the data had an eighth, "Skeptic/Critic", which the assistant
 * could then not link.
 */
import { describe, it, expect } from 'vitest'
import { LEADER_CATEGORIES, leaderMatchesCategory } from './leadersConstants'
import { LEADER_CATEGORIES as SIDEBAR_CATEGORIES } from './LeaderCategorySidebar'
import { leadersData } from '@/data/leadersData'

describe('LEADER_CATEGORIES', () => {
  it('is exactly the set of categories the leaders in the data have', () => {
    expect(new Set(LEADER_CATEGORIES)).toEqual(new Set(leadersData.map((l) => l.category)))
  })

  it('lists each category once, including Skeptic/Critic', () => {
    expect(new Set(LEADER_CATEGORIES).size).toBe(LEADER_CATEGORIES.length)
    expect(LEADER_CATEGORIES).toContain('Skeptic/Critic')
  })

  it('selects leaders for every category, the slash included', () => {
    for (const category of LEADER_CATEGORIES) {
      expect(
        leadersData.filter((l) => leaderMatchesCategory(l, category)).length,
        `category ${category}`
      ).toBeGreaterThan(0)
    }
  })

  it('is the same list the category sidebar re-exports', () => {
    expect(SIDEBAR_CATEGORIES).toBe(LEADER_CATEGORIES)
  })
})
