// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { Leader } from '@/data/leadersData'
import {
  leaderPatentsHref,
  findLeaderByName,
  findLeaderByParam,
  leaderNameSlug,
  normalizeLeaderName,
  planLeaderDeepLink,
  resolveLeaderParam,
} from './leaderDeepLink'
import { leadersData, deprecatedLeaderSuccessors } from '@/data/leadersData'

const L = (over: Partial<Leader>): Leader =>
  ({
    id: 'x',
    leaderId: over.id ?? 'x',
    name: 'X',
    country: 'USA',
    title: '',
    organizations: [],
    type: 'Private',
    category: 'Research',
    bio: '',
    sourceKind: 'curated',
    ...over,
  }) as Leader

const leaders = [
  L({
    id: 'moody-dr',
    name: 'Dr. Dustin Moody',
    country: 'USA',
    type: 'Public',
    category: 'Government',
  }),
  L({ id: 'moody', name: 'Dustin Moody', country: 'USA', type: 'Public', category: 'Government' }),
  L({
    id: 'stub',
    name: 'Aaron Voisine',
    country: 'France',
    category: 'Standards',
    sourceKind: 'auto-imported',
  }),
  L({ id: 'ana', name: 'Ana Lee', country: 'UK', type: 'Academic', category: 'Research' }),
]

describe('normalizeLeaderName / findLeaderByName', () => {
  it('ignores case, extra whitespace and an optional Dr. prefix', () => {
    expect(normalizeLeaderName('  Dr.  Ana   LEE ')).toBe('ana lee')
    expect(normalizeLeaderName('dr Ana Lee')).toBe('ana lee')
    expect(findLeaderByName(leaders, 'ana lee')?.id).toBe('ana')
    expect(findLeaderByName(leaders, 'Dr. Ana Lee')?.id).toBe('ana')
  })
  it('prefers an exact match when normalized names collide', () => {
    expect(findLeaderByName(leaders, 'Dustin Moody')?.id).toBe('moody')
    expect(findLeaderByName(leaders, 'Dr. Dustin Moody')?.id).toBe('moody-dr')
  })
  it('returns undefined for unknown or blank names', () => {
    expect(findLeaderByName(leaders, 'Nobody')).toBeUndefined()
    expect(findLeaderByName(leaders, '   ')).toBeUndefined()
  })
})

describe('findLeaderByParam (leader_id first, then name)', () => {
  it('resolves the stable leader_id before any name match', () => {
    expect(findLeaderByParam(leaders, 'moody-dr')?.name).toBe('Dr. Dustin Moody')
    expect(findLeaderByParam(leaders, ' ANA ')?.id).toBe('ana')
  })
  it('keeps old display-name links working (exact, then tolerant)', () => {
    expect(findLeaderByParam(leaders, 'Dustin Moody')?.id).toBe('moody')
    expect(findLeaderByParam(leaders, 'prof. dr. ana lee')?.id).toBe('ana')
  })
  it('accepts a bare name slug, preferring a curated profile over a stub', () => {
    expect(findLeaderByParam(leaders, 'ana-lee')?.id).toBe('ana')
    const dup = [
      L({ id: 'stub-x', name: 'Zed Roe', sourceKind: 'auto-imported' }),
      L({ id: 'cur-x', name: 'Dr. Zed Roe' }),
    ]
    expect(findLeaderByParam(dup, 'zed-roe')?.id).toBe('cur-x')
  })
  it('returns undefined for blank or unknown values', () => {
    expect(findLeaderByParam(leaders, '  ')).toBeUndefined()
    expect(findLeaderByParam(leaders, 'no-such-person')).toBeUndefined()
  })
})

describe('deprecated duplicate forwarding', () => {
  const successors = new Map([
    ['ana-lee-old', { successorId: 'ana', name: 'Dr. Ana Lee' }],
    ['ana-lee-older', { successorId: 'ana-lee-old', name: 'Ana Lee' }],
    ['loop-a', { successorId: 'loop-b', name: 'A' }],
    ['loop-b', { successorId: 'loop-a', name: 'B' }],
    ['gone', { successorId: 'nobody', name: 'Gone Person' }],
  ])
  it('resolves a deprecated leader_id to its kept profile and names the duplicate', () => {
    expect(resolveLeaderParam(leaders, 'ana-lee-old', successors)).toEqual({
      leader: leaders[3],
      forwardedFrom: 'Dr. Ana Lee',
    })
    expect(findLeaderByParam(leaders, ' ANA-LEE-OLD ', successors)?.id).toBe('ana')
  })
  it('follows a chain of merges, and a cycle or missing successor falls through to names', () => {
    expect(resolveLeaderParam(leaders, 'ana-lee-older', successors)?.forwardedFrom).toBe('Ana Lee')
    expect(findLeaderByParam(leaders, 'ana-lee-older', successors)?.id).toBe('ana')
    expect(findLeaderByParam(leaders, 'loop-a', successors)).toBeUndefined()
    expect(findLeaderByParam(leaders, 'gone', successors)).toBeUndefined()
  })
  it('an active id wins over the successor map, and plain matches carry no forwarding', () => {
    const shadow = new Map([['ana', { successorId: 'moody', name: 'X' }]])
    expect(resolveLeaderParam(leaders, 'ana', shadow)).toEqual({ leader: leaders[3] })
  })
  it('planLeaderDeepLink reports forwardedFrom alongside any widening', () => {
    const plan = planLeaderDeepLink(
      leaders,
      new URLSearchParams('leader=ana-lee-old&sector=Public'),
      successors
    )
    expect(plan).toMatchObject({
      kind: 'found',
      forwardedFrom: 'Dr. Ana Lee',
      widened: ['sector "Public"'],
    })
    expect(planLeaderDeepLink(leaders, new URLSearchParams('leader=ana-lee-old'))).toEqual({
      kind: 'not-found',
      name: 'ana-lee-old',
    })
  })
})

describe('merged duplicates in the shipped CSV', () => {
  it('every successor is an active profile, and no active name is duplicated', () => {
    expect(deprecatedLeaderSuccessors.size).toBeGreaterThan(0)
    const activeIds = new Set(leadersData.map((l) => l.leaderId))
    for (const [id, s] of deprecatedLeaderSuccessors) {
      expect(activeIds.has(id)).toBe(false)
      expect(activeIds.has(s.successorId)).toBe(true)
    }
    const slugs = leadersData.map((l) => leaderNameSlug(l.name))
    expect(new Set(slugs).size).toBe(slugs.length)
  })
  it("a merged duplicate's old id and old name both open the kept profile", () => {
    for (const [id, s] of deprecatedLeaderSuccessors) {
      const kept = leadersData.find((l) => l.leaderId === s.successorId)
      const match = resolveLeaderParam(leadersData, id, deprecatedLeaderSuccessors)
      expect(match?.leader).toBe(kept)
      expect(match?.forwardedFrom).toBe(s.name)
      expect(findLeaderByParam(leadersData, s.name, deprecatedLeaderSuccessors)).toBe(kept)
    }
  })
  it('Dustin Moody: the stub id forwards to the NIST profile', () => {
    expect(
      findLeaderByParam(leadersData, 'dustin-moody-nist-2', deprecatedLeaderSuccessors)?.name
    ).toBe('Dr. Dustin Moody')
  })
})

describe('leader_id values in the shipped CSV', () => {
  it('each id starts with the name slug the resolver computes (minting stays in step)', () => {
    for (const l of leadersData) {
      expect(l.leaderId.startsWith(leaderNameSlug(l.name))).toBe(true)
    }
  })
  it('every row resolves from its own id and from its display name', () => {
    for (const l of leadersData) {
      expect(findLeaderByParam(leadersData, l.leaderId)).toBe(l)
      expect(findLeaderByParam(leadersData, l.name)).toBe(l)
    }
  })
  it('folds accents, ß and honorifics like the minting script', () => {
    expect(leaderNameSlug('Prof. Dr. Thomas Pöppelmann')).toBe('thomas-poppelmann')
    expect(leaderNameSlug('John Preuß Mattsson')).toBe('john-preuss-mattsson')
  })
})

describe('planLeaderDeepLink', () => {
  const plan = (qs: string) => planLeaderDeepLink(leaders, new URLSearchParams(qs))

  it('returns null without a leader param', () => {
    expect(plan('cat=Government')).toBeNull()
  })
  it('resolves a leader_id link', () => {
    expect(plan('leader=ana')).toMatchObject({ kind: 'found', leader: { name: 'Ana Lee' } })
  })
  it('reports unknown names as not-found', () => {
    expect(plan('leader=Nobody')).toEqual({ kind: 'not-found', name: 'Nobody' })
  })
  it('changes nothing when no filter hides the person', () => {
    const p = plan('leader=Ana+Lee&cat=Research&region=eu')
    expect(p).toMatchObject({ kind: 'found', widened: [], nextParams: null })
  })
  it('reveals a stub by writing all=1 in the same params (the %20 regression)', () => {
    const p = plan('leader=Aaron%20Voisine')
    expect(p?.kind).toBe('found')
    if (p?.kind !== 'found') return
    expect(p.nextParams?.get('all')).toBe('1')
    expect(p.nextParams?.get('leader')).toBe('Aaron Voisine')
  })
  it('clears only the excluding filters and keeps the rest', () => {
    const p = plan('leader=Ana+Lee&cat=Government&sector=Academic&q=zzzz&mode=table')
    if (p?.kind !== 'found') throw new Error('expected found')
    const n = p.nextParams!
    expect(n.get('cat')).toBeNull()
    expect(n.get('q')).toBeNull()
    expect(n.get('sector')).toBe('Academic')
    expect(n.get('mode')).toBe('table')
    expect(p.widened).toHaveLength(2)
  })
  it('clears a region that excludes the person, and a stale region behind a cleared country', () => {
    const r = plan('leader=Ana+Lee&region=americas')
    if (r?.kind !== 'found') throw new Error('expected found')
    expect(r.nextParams?.get('region')).toBeNull()
    const c = plan('leader=Ana+Lee&country=USA&region=americas')
    if (c?.kind !== 'found') throw new Error('expected found')
    expect(c.nextParams?.get('country')).toBeNull()
    expect(c.nextParams?.get('region')).toBeNull()
  })
})

describe('leaderPatentsHref', () => {
  it('opens a single patent directly with the US-prefixed number', () => {
    expect(leaderPatentsHref(['10742413'])).toBe(
      '/patents?patentIds=10742413&tab=explore&patent=US10742413'
    )
    expect(leaderPatentsHref(['US10742413'])).toContain('&patent=US10742413')
  })
  it('keeps only the patentIds scope for several patents', () => {
    expect(leaderPatentsHref(['20200358619', '10764042'])).toBe(
      '/patents?patentIds=20200358619%2C10764042&tab=explore'
    )
  })
})
