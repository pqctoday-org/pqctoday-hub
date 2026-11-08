// SPDX-License-Identifier: AGPL-3.0-only
//
// The loader itself applies the life-cycle rules, so no view can draw a
// "replaces an older edition" link from a draft. SP 800-131A Rev 3 and
// SP 800-57 Part 1 Rev 6 are initial public drafts: a data file that says they
// replace Rev 2 and Rev 5 must not make that claim appear on the site.
import { describe, expect, it, vi } from 'vitest'
import type { RawXwalkRow } from './conceptXwalkData'

const RAW = vi.hoisted(() => {
  const base = {
    rationale_type: 'policy_reference',
    evidence: 'The newer edition states that it replaces the older one.',
    verified_date: '2026-11-08',
    verified_by: 'test',
    confidence: 'high',
  }
  return [
    {
      ...base,
      xwalk_id: 'xw-keep-overlap',
      from_concept: 'NIST CSWP 39',
      from_concept_id: 'framework:nist-cswp-39',
      to_concept: 'FIPS 203',
      to_concept_id: 'standard:fips-203',
      relationship_type: 'intersects_with',
    },
    {
      ...base,
      xwalk_id: 'xw-draft-57',
      from_concept: 'NIST-SP-800-57-Pt1-R6',
      from_concept_id: 'standard:nist-sp-800-57-pt1-r6',
      to_concept: 'NIST-SP-800-57-Pt1-R5',
      to_concept_id: 'standard:nist-sp-800-57-pt1-r5',
      relationship_type: 'supersedes',
    },
    {
      ...base,
      xwalk_id: 'xw-draft-131a',
      from_concept: 'NIST-SP-800-131A-Rev3',
      from_concept_id: 'standard:nist-sp-800-131a-rev3',
      to_concept: 'NIST-SP-800-131A-Rev2',
      to_concept_id: 'standard:nist-sp-800-131a-rev2',
      relationship_type: 'supersedes',
    },
    {
      ...base,
      xwalk_id: 'xw-publisher-not-curated',
      from_concept: 'NIST-SP-800-57-Pt1-R5',
      from_concept_id: 'standard:nist-sp-800-57-pt1-r5',
      to_concept: 'Made Up Institute',
      to_concept_id: 'concept_only:org-made-up-institute',
      relationship_type: 'published_by',
    },
  ] satisfies RawXwalkRow[]
})

vi.mock('./csvUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./csvUtils')>()
  return {
    ...actual,
    loadLatestCSV: (...args: Parameters<typeof actual.loadLatestCSV>) => {
      const [, regex, transform] = args
      if (!regex.source.includes('concept_xwalks')) return actual.loadLatestCSV(...args)
      const data = RAW.map((r, i) => (transform as (raw: unknown, i: number) => unknown)(r, i))
      return { data: data.filter(Boolean), previousData: null, metadata: null }
    },
  }
})

import { conceptXwalkData, conceptXwalkRejectedLifecycleLinks } from './conceptXwalkData'

describe('the cross-walk loader applies the life-cycle rules', () => {
  it('draws no replacement link from a draft edition, and no publisher outside the curated list', () => {
    expect(conceptXwalkData.map((r) => r.xwalkId)).toEqual(['xw-keep-overlap'])
  })

  it('lists each rejected row with a plain reason, for the data checks', () => {
    const byId = Object.fromEntries(
      conceptXwalkRejectedLifecycleLinks.map((r) => [r.record.xwalkId, r.reason])
    )
    expect(Object.keys(byId).sort()).toEqual([
      'xw-draft-131a',
      'xw-draft-57',
      'xw-publisher-not-curated',
    ])
    expect(byId['xw-draft-57']).toMatch(/still a draft/)
    expect(byId['xw-draft-131a']).toMatch(/still a draft/)
    expect(byId['xw-publisher-not-curated']).toMatch(/not a curated source organisation/)
  })
})
