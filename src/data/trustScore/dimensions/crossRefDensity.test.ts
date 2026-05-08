// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { scoreCrossRefDensity } from './crossRefDensity'
import type { ScoringContext } from '../types'

function makeCtx(
  xrefs: Array<{ sourceId: string; matchMethod: string }>,
  trusted: Record<string, string>
): ScoringContext {
  return {
    trustedSources: new Map(
      Object.entries(trusted).map(([k, v]) => [k, { trustTier: v, sourceType: '' }])
    ),
    xrefsByResource: new Map([['R', xrefs]]),
    libraryEnrichments: {},
    timelineEnrichments: {},
    threatsEnrichments: {},
    manifestStatuses: new Map(),
    complianceLibraryRefs: new Map(),
    complianceTimelineRefs: new Map(),
    libraryDependencies: new Map(),
    threatModuleRefs: new Map(),
    demonstrableAlgorithms: new Set(),
  }
}

describe('crossRefDensity — T17 tier-diversity scoring', () => {
  it('does not boost when all citations come from the same tier', () => {
    // 3 verified xrefs, all Tier-1 → baseline 60 (effective 3, range 2-3)
    const ctx = makeCtx(
      [
        { sourceId: 'a', matchMethod: 'direct' },
        { sourceId: 'b', matchMethod: 'direct' },
        { sourceId: 'c', matchMethod: 'direct' },
      ],
      { a: '1_Authoritative', b: '1_Authoritative', c: '1_Authoritative' }
    )
    const r = scoreCrossRefDensity('R', ctx)
    expect(r.rawScore).toBe(60)
    expect(r.rationale).not.toContain('diversity')
  })

  it('boosts when citations span 2 distinct tiers (5%)', () => {
    const ctx = makeCtx(
      [
        { sourceId: 'a', matchMethod: 'direct' },
        { sourceId: 'b', matchMethod: 'direct' },
        { sourceId: 'c', matchMethod: 'direct' },
      ],
      { a: '1_Authoritative', b: '2_Core', c: '2_Core' }
    )
    const r = scoreCrossRefDensity('R', ctx)
    expect(r.rawScore).toBe(63) // round(60 * 1.05)
    expect(r.rationale).toContain('2 trust tiers')
  })

  it('boosts when citations span 3+ distinct tiers (10%)', () => {
    const ctx = makeCtx(
      [
        { sourceId: 'a', matchMethod: 'direct' },
        { sourceId: 'b', matchMethod: 'direct' },
        { sourceId: 'c', matchMethod: 'direct' },
      ],
      { a: '1_Authoritative', b: '2_Core', c: '3_Supporting' }
    )
    const r = scoreCrossRefDensity('R', ctx)
    expect(r.rawScore).toBe(66) // round(60 * 1.10)
    expect(r.rationale).toContain('3 trust tiers')
  })

  it('cross-tier corroboration outranks same-tier redundancy at the same count', () => {
    const sameTier = makeCtx(
      Array.from({ length: 4 }, (_, i) => ({
        sourceId: String.fromCharCode(97 + i),
        matchMethod: 'direct',
      })),
      { a: '1_Authoritative', b: '1_Authoritative', c: '1_Authoritative', d: '1_Authoritative' }
    )
    const crossTier = makeCtx(
      Array.from({ length: 4 }, (_, i) => ({
        sourceId: String.fromCharCode(97 + i),
        matchMethod: 'direct',
      })),
      { a: '1_Authoritative', b: '2_Core', c: '3_Supporting', d: '4_Contextual' }
    )
    expect(scoreCrossRefDensity('R', crossTier).rawScore).toBeGreaterThan(
      scoreCrossRefDensity('R', sameTier).rawScore
    )
  })
})
