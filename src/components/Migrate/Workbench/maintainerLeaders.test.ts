// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { Leader } from '@/data/leadersData'
import { leadersData } from '@/data/leadersData'
import { softwareData } from '@/data/migrateData'
import {
  leaderProfileHref,
  maintainerLinksFor,
  parseMaintainer,
  useLeadersRoster,
} from './maintainerLeaders'

const leader = (over: Partial<Leader>): Leader =>
  ({
    id: over.leaderId ?? 'x',
    leaderId: 'x',
    name: 'X',
    country: '',
    title: '',
    organizations: [],
    type: 'Public',
    category: '',
    bio: '',
    ...over,
  }) as Leader

const ROSTER: Leader[] = [
  leader({ leaderId: 'ada-lovelace', name: 'Ada Lovelace', migrateCatalogRefs: ['lib-a'] }),
  leader({ leaderId: 'thing-han-lim', name: 'Thing-han Lim', migrateCatalogRefs: ['lib-a'] }),
  leader({ leaderId: 'grace-hopper', name: 'Dr. Grace Hopper' }),
  leader({ leaderId: 'jurg-x', name: 'Jürg Wüllschleger', migrateCatalogRefs: ['lib-a'] }),
]

describe('parseMaintainer', () => {
  it('splits a forge handle off the name', () => {
    expect(parseMaintainer('David Hook (github:dghgit)')).toEqual({
      name: 'David Hook',
      handle: 'dghgit',
    })
  })
  it('keeps a non-handle parenthetical as part of the name', () => {
    expect(parseMaintainer('IntersectMBO (Cardano)')).toEqual({ name: 'IntersectMBO (Cardano)' })
  })
})

describe('maintainerLinksFor', () => {
  const product = (m: string[]) => ({ productId: 'lib-a', openSourceMaintainers: m })

  it('links a maintainer credited by the leader’s MigrateCatalogRefs', () => {
    const [m] = maintainerLinksFor(product(['Ada Lovelace (github:ada)']), ROSTER)
    expect(m.name).toBe('Ada Lovelace')
    expect(m.leader?.leaderId).toBe('ada-lovelace')
  })

  it('re-orders a surname-first name ("Lim, Thing-han")', () => {
    const [m] = maintainerLinksFor(product(['Lim, Thing-han (github:p)']), ROSTER)
    expect(m.leader?.leaderId).toBe('thing-han-lim')
  })

  it('folds accents within the credited set', () => {
    const [m] = maintainerLinksFor(product(['Jurg Wullschleger']), ROSTER)
    expect(m.leader?.leaderId).toBe('jurg-x')
  })

  it('falls back to the Community matcher (honorific-tolerant) for an uncredited name', () => {
    const [m] = maintainerLinksFor(product(['Grace Hopper']), ROSTER)
    expect(m.leader?.leaderId).toBe('grace-hopper')
  })

  it('leaves organisations and unknown people as plain text', () => {
    const links = maintainerLinksFor(product(['Web3 Foundation', 'MW (github:mwcw)']), ROSTER)
    expect(links.map((l) => l.leader)).toEqual([null, null])
    expect(links.map((l) => l.name)).toEqual(['Web3 Foundation', 'MW'])
  })

  it('renders every name as text while the roster is not loaded', () => {
    const links = maintainerLinksFor(product(['Ada Lovelace']), null)
    expect(links).toEqual([{ name: 'Ada Lovelace', leader: null }])
  })

  it('a product with no maintainers yields nothing', () => {
    expect(maintainerLinksFor({ productId: 'lib-a' }, ROSTER)).toEqual([])
  })

  it('builds the /leaders link from the stable leader_id', () => {
    expect(leaderProfileHref({ leaderId: 'ada-lovelace', name: 'Ada Lovelace' })).toBe(
      '/leaders?leader=ada-lovelace'
    )
  })
})

describe('maintainer links — real catalogue + roster', () => {
  const withMaintainers = softwareData.filter((p) => (p.openSourceMaintainers?.length ?? 0) > 0)

  it('the loader exposes open_source_maintainers, split on ";" only', () => {
    expect(withMaintainers.length).toBeGreaterThan(0)
    const mlkem = softwareData.find((p) => p.productId === 'mlkem-native')
    if (mlkem?.openSourceMaintainers?.length) {
      expect(mlkem.openSourceMaintainers.some((m) => m.startsWith('Lim, Thing-han'))).toBe(true)
    }
  })

  it('every resolved maintainer points at a real active leader', () => {
    const ids = new Set(leadersData.map((l) => l.leaderId))
    let resolved = 0
    for (const p of withMaintainers) {
      for (const m of maintainerLinksFor(p, leadersData)) {
        if (!m.leader) continue
        resolved++
        expect(ids.has(m.leader.leaderId)).toBe(true)
      }
    }
    expect(resolved).toBeGreaterThan(0)
  })

  it('every leader crediting a product matches one of its listed maintainers', () => {
    // The reverse edge (MigrateCatalogRefs) is what makes a link
    // authoritative; a credited leader the matcher cannot find is a
    // name-format case this module does not handle yet.
    for (const p of withMaintainers) {
      const linked = new Set(maintainerLinksFor(p, leadersData).map((m) => m.leader?.leaderId))
      const credited = leadersData.filter((l) => (l.migrateCatalogRefs ?? []).includes(p.productId))
      for (const l of credited) expect(linked, `${p.productId} → ${l.name}`).toContain(l.leaderId)
    }
  })
})

describe('useLeadersRoster', () => {
  it('loads the roster only when needed', async () => {
    const { result: idle } = renderHook(() => useLeadersRoster(false))
    expect(idle.current).toBeNull()
    const { result } = renderHook(() => useLeadersRoster(true))
    await waitFor(() => expect(result.current).not.toBeNull())
    expect(result.current!.length).toBe(leadersData.length)
  })
})
