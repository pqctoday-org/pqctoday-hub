// SPDX-License-Identifier: GPL-3.0-only
/**
 * UnifiedSearchService.searchPaletteWithHidden — how many results the
 * "Authoritative only" palette filter removed, so the ⌘K palette can say so.
 * `searchPalette` itself must keep its existing behaviour.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { UnifiedSearchService } from '../UnifiedSearchService'
import { getScoresForType } from '@/data/trustScore'
import type { RAGChunk } from '@/types/ChatTypes'

const TOKEN = 'HIDDENBYTIERQQQ'

function libraryChunk(refId: string, id: string): RAGChunk {
  return {
    id,
    source: 'library',
    title: refId,
    content: `${TOKEN} library ${refId}`,
    category: 'standards',
    metadata: { referenceId: refId },
  }
}

function untiered(id: string, source: string): RAGChunk {
  return { id, source, title: id, content: `${TOKEN} ${source}`, category: 'x', metadata: {} }
}

function fixtures(): { corpus: RAGChunk[]; authId: string; lowId: string } | null {
  const lib = getScoresForType('library')
  const auth = lib.find((s) => s.tier === 'Authoritative')
  const low = lib.find((s) => s.tier === 'Low')
  if (!auth || !low) return null
  return {
    authId: 'lib-auth',
    lowId: 'lib-low',
    corpus: [
      libraryChunk(auth.resourceId, 'lib-auth'),
      libraryChunk(low.resourceId, 'lib-low'),
      untiered('gloss-1', 'glossary'),
      untiered('gloss-2', 'glossary'),
      untiered('quiz-1', 'quiz'),
    ],
  }
}

describe('searchPaletteWithHidden', () => {
  beforeEach(() => {
    UnifiedSearchService.resetInstance()
  })

  it('reports exactly the hits the tier filter removed (tier-null and low-tier)', () => {
    const fx = fixtures()
    if (!fx) return
    const svc = UnifiedSearchService.getInstance()
    svc.initializeWithCorpus(fx.corpus)

    const { results, hidden } = svc.searchPaletteWithHidden(TOKEN, { authoritativeOnly: true })
    expect(results.map((r) => r.id)).toEqual([fx.authId])
    expect(hidden.map((h) => h.id).sort()).toEqual(['gloss-1', 'gloss-2', 'lib-low', 'quiz-1'])
    expect(hidden.filter((h) => h.source === 'glossary')).toHaveLength(2)
    // hidden + shown == what the same query returns with the filter off
    const all = svc.searchPalette(TOKEN, { authoritativeOnly: false })
    expect(results.length + hidden.length).toBe(all.length)
  })

  it('returns the same results as searchPalette and leaves searchPalette unchanged', () => {
    const fx = fixtures()
    if (!fx) return
    const svc = UnifiedSearchService.getInstance()
    svc.initializeWithCorpus(fx.corpus)

    for (const authoritativeOnly of [true, false]) {
      const plain = svc.searchPalette(TOKEN, { authoritativeOnly })
      const { results } = svc.searchPaletteWithHidden(TOKEN, { authoritativeOnly })
      expect(results).toEqual(plain)
    }
  })

  it('hides nothing when the filter is off', () => {
    const fx = fixtures()
    if (!fx) return
    const svc = UnifiedSearchService.getInstance()
    svc.initializeWithCorpus(fx.corpus)

    expect(svc.searchPaletteWithHidden(TOKEN).hidden).toEqual([])
    expect(svc.searchPaletteWithHidden(TOKEN, { authoritativeOnly: false }).hidden).toEqual([])
  })

  it('hides nothing when every match is Authoritative/High', () => {
    const fx = fixtures()
    if (!fx) return
    const svc = UnifiedSearchService.getInstance()
    svc.initializeWithCorpus(fx.corpus.filter((c) => c.id === fx.authId))

    const { results, hidden } = svc.searchPaletteWithHidden(TOKEN, { authoritativeOnly: true })
    expect(results).toHaveLength(1)
    expect(hidden).toEqual([])
  })

  it('counts everything as hidden when no match is tiered (the glossary-only case)', () => {
    const svc = UnifiedSearchService.getInstance()
    svc.initializeWithCorpus([untiered('g1', 'glossary'), untiered('g2', 'glossary')])

    const { results, hidden } = svc.searchPaletteWithHidden(TOKEN, { authoritativeOnly: true })
    expect(results).toHaveLength(0)
    expect(hidden).toHaveLength(2)
  })

  it('respects the `sources` option: hits outside the requested sources are not "hidden"', () => {
    const fx = fixtures()
    if (!fx) return
    const svc = UnifiedSearchService.getInstance()
    svc.initializeWithCorpus(fx.corpus)

    const { hidden } = svc.searchPaletteWithHidden(TOKEN, {
      authoritativeOnly: true,
      sources: ['glossary'],
    })
    expect(hidden.map((h) => h.id).sort()).toEqual(['gloss-1', 'gloss-2'])
  })

  it('returns empty before the index is built', () => {
    expect(
      UnifiedSearchService.getInstance().searchPaletteWithHidden(TOKEN, { authoritativeOnly: true })
    ).toEqual({ results: [], hidden: [] })
  })
})
