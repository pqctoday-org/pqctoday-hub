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
    communitySignals: new Map(),
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

describe('crossRefDensity — community-corroboration sub-signal (§5.5)', () => {
  function withSignals(endorsements: number): ScoringContext {
    const ctx = makeCtx(
      [
        { sourceId: 'a', matchMethod: 'direct' },
        { sourceId: 'b', matchMethod: 'direct' },
      ],
      { a: '1_Authoritative', b: '1_Authoritative' }
    )
    ctx.communitySignals = new Map([['library:R', { endorsements, flags: 0 }]])
    return ctx
  }

  it('does not bump when no resourceType is supplied (legacy callers)', () => {
    const ctx = withSignals(5)
    const r = scoreCrossRefDensity('R', ctx)
    expect(r.rawScore).toBe(60) // baseline, no bonus
    expect(r.rationale).not.toContain('endorsement')
  })

  it('does not bump on a single endorsement (anonymous-click guard)', () => {
    const ctx = withSignals(1)
    const r = scoreCrossRefDensity('R', ctx, 'library')
    expect(r.rawScore).toBe(60)
    expect(r.rationale).not.toContain('endorsement')
  })

  it('+3 for 2 endorsements', () => {
    const ctx = withSignals(2)
    const r = scoreCrossRefDensity('R', ctx, 'library')
    expect(r.rawScore).toBe(63)
    expect(r.rationale).toContain('2 community endorsement(s) (+3)')
  })

  it('+5 for 3 endorsements', () => {
    const ctx = withSignals(3)
    const r = scoreCrossRefDensity('R', ctx, 'library')
    expect(r.rawScore).toBe(65)
    expect(r.rationale).toContain('3 community endorsement(s) (+5)')
  })

  it('+8 for 5+ endorsements', () => {
    const ctx = withSignals(20)
    const r = scoreCrossRefDensity('R', ctx, 'library')
    expect(r.rawScore).toBe(68)
    expect(r.rationale).toContain('20 community endorsement(s) (+8)')
  })

  it('caps at 100 even when bonus would push past', () => {
    const ctx = makeCtx(
      Array.from({ length: 8 }, (_, i) => ({ sourceId: String(i), matchMethod: 'direct' })),
      Object.fromEntries(Array.from({ length: 8 }, (_, i) => [String(i), '1_Authoritative']))
    )
    ctx.communitySignals = new Map([['library:R', { endorsements: 5, flags: 0 }]])
    const r = scoreCrossRefDensity('R', ctx, 'library')
    // 8 effective xrefs → baseline 100; +8 community bonus would yield 108 → clamped to 100
    expect(r.rawScore).toBe(100)
  })

  it('flags do NOT subtract from the score', () => {
    const ctx = makeCtx(
      [
        { sourceId: 'a', matchMethod: 'direct' },
        { sourceId: 'b', matchMethod: 'direct' },
      ],
      { a: '1_Authoritative', b: '1_Authoritative' }
    )
    ctx.communitySignals = new Map([['library:R', { endorsements: 0, flags: 5 }]])
    const r = scoreCrossRefDensity('R', ctx, 'library')
    expect(r.rawScore).toBe(60) // unchanged from baseline
  })

  it('migrate resourceType maps to pqc-tool signal key', () => {
    const ctx = makeCtx([{ sourceId: 'a', matchMethod: 'direct' }], { a: '1_Authoritative' })
    ctx.communitySignals = new Map([['pqc-tool:R', { endorsements: 3, flags: 0 }]])
    const r = scoreCrossRefDensity('R', ctx, 'migrate')
    expect(r.rationale).toContain('community endorsement')
  })

  it('threats resourceType maps to threat signal key', () => {
    const ctx = makeCtx([{ sourceId: 'a', matchMethod: 'direct' }], { a: '1_Authoritative' })
    ctx.communitySignals = new Map([['threat:R', { endorsements: 3, flags: 0 }]])
    const r = scoreCrossRefDensity('R', ctx, 'threats')
    expect(r.rationale).toContain('community endorsement')
  })
})
