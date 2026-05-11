// SPDX-License-Identifier: GPL-3.0-only
/**
 * UnifiedSearchService.searchPalette — tier-aware ordering + Authoritative-
 * only toggle (§14.3 step 2 + step 5 of trust-engine-explainability).
 *
 * Mirrors the chat-path contract in RetrievalService.tierOrdering.test.ts —
 * after this code change, the ⌘K palette applies the same tier multiplier
 * and exposes an `authoritativeOnly` filter that restricts results to
 * Authoritative + High tiers.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { UnifiedSearchService } from '../UnifiedSearchService'
import { getScoresForType } from '@/data/trustScore'
import type { RAGChunk } from '@/types/ChatTypes'

function libraryChunk(refId: string, content: string, id?: string): RAGChunk {
  return {
    id: id ?? `test-${refId.replace(/[^a-z0-9]+/gi, '-')}`,
    source: 'library',
    title: refId,
    content,
    category: 'standards',
    metadata: { referenceId: refId },
  }
}

describe('searchPalette — tier-aware ordering (§14.3 step 2)', () => {
  beforeEach(() => {
    UnifiedSearchService.resetInstance()
  })

  it('higher-tier library chunk outranks lower-tier when text scores tie', () => {
    const libScores = getScoresForType('library')
    const top = libScores.find((s) => s.tier === 'Authoritative')
    const bottom =
      libScores.find((s) => s.tier === 'Low') ?? libScores.find((s) => s.tier === 'Moderate')
    if (!top || !bottom || top.resourceId === bottom.resourceId) return

    const token = 'TIERPALETTEORDERZZZ'
    const corpus: RAGChunk[] = [
      libraryChunk(top.resourceId, `${token} authoritative variant`),
      libraryChunk(bottom.resourceId, `${token} lower-tier variant`),
    ]
    const svc = UnifiedSearchService.getInstance()
    svc.initializeWithCorpus(corpus)

    const results = svc.searchPalette(token)
    expect(results.length).toBeGreaterThanOrEqual(2)
    const topRank = results.findIndex((r) => r.metadata?.referenceId === top.resourceId)
    const bottomRank = results.findIndex((r) => r.metadata?.referenceId === bottom.resourceId)
    expect(topRank).toBeGreaterThanOrEqual(0)
    expect(bottomRank).toBeGreaterThanOrEqual(0)
    expect(topRank).toBeLessThan(bottomRank)
  })
})

describe('searchPalette — authoritativeOnly toggle (§14.3 step 5)', () => {
  beforeEach(() => {
    UnifiedSearchService.resetInstance()
  })

  it('excludes Low / Moderate / unscored chunks when toggle is on', () => {
    const libScores = getScoresForType('library')
    const auth = libScores.find((s) => s.tier === 'Authoritative')
    const low = libScores.find((s) => s.tier === 'Low')
    if (!auth || !low) return

    const token = 'AUTHONLYTOGGLEYYY'
    const corpus: RAGChunk[] = [
      libraryChunk(auth.resourceId, `${token} authoritative`),
      libraryChunk(low.resourceId, `${token} low-tier`),
      // Unscored chunk — refId not in the trust score map
      libraryChunk('does-not-exist-zzz-abc-123', `${token} unscored`, 'test-unscored'),
    ]
    const svc = UnifiedSearchService.getInstance()
    svc.initializeWithCorpus(corpus)

    const all = svc.searchPalette(token, { authoritativeOnly: false })
    const restricted = svc.searchPalette(token, { authoritativeOnly: true })

    expect(all.length).toBeGreaterThan(restricted.length)
    // Restricted set should not include the Low-tier chunk
    expect(restricted.find((r) => r.metadata?.referenceId === low.resourceId)).toBeUndefined()
    // Restricted set should not include the unscored chunk
    expect(restricted.find((r) => r.id === 'test-unscored')).toBeUndefined()
    // Authoritative chunk should remain
    expect(restricted.find((r) => r.metadata?.referenceId === auth.resourceId)).toBeDefined()
  })

  it('returns empty when no result has Authoritative or High tier', () => {
    const token = 'NOMATCHTOAUTHWWW'
    const corpus: RAGChunk[] = [
      // All chunks resolve to unknown tier — chunkToResource returns null for
      // sources like 'glossary'.
      {
        id: 'g1',
        source: 'glossary',
        title: 'first',
        content: `${token} alpha`,
        category: 'x',
        metadata: {},
      },
      {
        id: 'g2',
        source: 'glossary',
        title: 'second',
        content: `${token} beta`,
        category: 'x',
        metadata: {},
      },
    ]
    const svc = UnifiedSearchService.getInstance()
    svc.initializeWithCorpus(corpus)

    const restricted = svc.searchPalette(token, { authoritativeOnly: true })
    expect(restricted).toHaveLength(0)
  })
})
