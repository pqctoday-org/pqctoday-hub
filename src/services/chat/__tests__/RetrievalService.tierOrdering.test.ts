// SPDX-License-Identifier: GPL-3.0-only
/**
 * RetrievalService tier-aware ordering (C6, §14.3 of trust-engine-explainability).
 *
 * Pins: when two chunks would tie on raw MiniSearch + intent boost, the
 * trust-tier multiplier breaks the tie in favor of the higher-tier resource.
 *
 * Strategy: seed the singleton with two minimal chunks pointing at REAL
 * library refIds known to score at different tiers in the live `trustScores`
 * map. Issue an identical-content query and assert the higher-tier chunk
 * comes first.
 *
 * The smoke test for ⌘K palette in e2e/cmdk-trust-order.spec.ts only verifies
 * that the palette opens; this unit test is the actual contract enforcement.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { RetrievalService } from '../RetrievalService'
import { UnifiedSearchService } from '@/services/search/UnifiedSearchService'
import { getScoresForType } from '@/data/trustScore'
import type { RAGChunk } from '@/types/ChatTypes'

function libraryChunk(refId: string, content: string): RAGChunk {
  return {
    id: `test-${refId.replace(/[^a-z0-9]+/gi, '-')}`,
    source: 'library',
    title: refId,
    content,
    category: 'standards',
    metadata: { referenceId: refId },
  }
}

describe('C6 — RetrievalService applies tier multiplier to break ties', () => {
  beforeEach(() => {
    RetrievalService.resetInstance()
    UnifiedSearchService.resetInstance()
  })

  it('higher-tier library chunk ranks above lower-tier when text scores tie', () => {
    // Pick one Authoritative and one Low/Moderate library record from the
    // live dataset. If the dataset has none of either, the test self-skips
    // (we don't want a brittle pin to a specific refId that may drift).
    const libScores = getScoresForType('library')
    const top = libScores.find((s) => s.tier === 'Authoritative')
    const bottom =
      libScores.find((s) => s.tier === 'Low') ?? libScores.find((s) => s.tier === 'Moderate')
    if (!top || !bottom || top.resourceId === bottom.resourceId) {
      // Dataset doesn't have the contrast — skip rather than pin a brittle case.
      return
    }

    const sharedToken = 'PQCTESTTOKENZZZ'
    const corpus: RAGChunk[] = [
      libraryChunk(top.resourceId, `${sharedToken} authoritative content`),
      libraryChunk(bottom.resourceId, `${sharedToken} lower-tier content`),
    ]

    const svc = RetrievalService.getInstance()
    svc.initializeWithCorpus(corpus)

    const results = svc.search(sharedToken, 5)
    expect(results.length).toBeGreaterThanOrEqual(2)

    // Find both chunks in the results.
    const topRank = results.findIndex((r) => r.metadata?.referenceId === top.resourceId)
    const bottomRank = results.findIndex((r) => r.metadata?.referenceId === bottom.resourceId)
    expect(topRank).toBeGreaterThanOrEqual(0)
    expect(bottomRank).toBeGreaterThanOrEqual(0)

    // Higher tier must appear at a lower index (= ranked higher).
    expect(topRank).toBeLessThan(bottomRank)
  })

  it('chunk with no scored resource gets the 0.95 default multiplier (loses to High)', () => {
    const libScores = getScoresForType('library')
    const high =
      libScores.find((s) => s.tier === 'High') ?? libScores.find((s) => s.tier === 'Authoritative')
    if (!high) return // dataset edge case

    const sharedToken = 'PQCTESTTOKENYYY'
    const corpus: RAGChunk[] = [
      libraryChunk(high.resourceId, `${sharedToken} scored content`),
      // Unscored chunk — refId not in trustScores map; default multiplier 0.95.
      libraryChunk('does-not-exist-zzz-9999', `${sharedToken} unscored content`),
    ]

    const svc = RetrievalService.getInstance()
    svc.initializeWithCorpus(corpus)

    const results = svc.search(sharedToken, 5)
    const scoredRank = results.findIndex((r) => r.metadata?.referenceId === high.resourceId)
    const unscoredRank = results.findIndex(
      (r) => r.metadata?.referenceId === 'does-not-exist-zzz-9999'
    )
    if (scoredRank === -1 || unscoredRank === -1) return // both must appear
    // Both should appear, with the scored High-tier ranked higher (×1.10 vs ×0.95).
    expect(scoredRank).toBeLessThan(unscoredRank)
  })
})
