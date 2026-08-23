// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS22 Stage 3 integration check — a real MiniSearch index built the way
 * production builds it (published corpus + registry-derived tool AND page
 * entries) actually returns the previously-unfindable pages for the words a
 * visitor would type.
 *
 * The drift guard next door proves the entries exist and route correctly. This
 * proves they are *retrievable* against the full 16k-chunk corpus, which is the
 * acceptance criterion that matters — the tool tier needed `ensureSources` for
 * exactly this reason, so "indexed" and "reachable" are not the same claim.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

import { UnifiedSearchService } from './UnifiedSearchService'
import { toolSearchEntries } from './toolSearchEntries'
import { PAGE_SOURCE, pageSearchEntries } from './pageSearchEntries'
import { PALETTE_ENSURE_SOURCES } from '@/data/searchRoutes'
import type { RAGChunk } from '@/types/ChatTypes'

let unified: UnifiedSearchService

beforeAll(async () => {
  const corpusPath = path.join(process.cwd(), 'public', 'data', 'rag-corpus.json')
  const data = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'))
  const corpus: RAGChunk[] = data.chunks ?? data

  UnifiedSearchService.resetInstance()
  unified = UnifiedSearchService.getInstance()
  // Mirrors the production `withRegistryEntries(...)` composition.
  unified.initializeWithCorpus([...corpus, ...toolSearchEntries(), ...(await pageSearchEntries())])
})

/** The palette's real call shape (CommandPalette.tsx). */
const PALETTE_OPTS = {
  limit: 60,
  ensureSources: [...PALETTE_ENSURE_SOURCES],
  ensureLimit: 3,
}

const QUERIES: Array<{ query: string; route: string }> = [
  { query: 'sponsor', route: '/sponsor' },
  { query: 'revisions', route: '/revisions' },
  { query: 'editorial independence', route: '/editorial-independence' },
  { query: 'simulation', route: '/simulation' },
  { query: 'changelog', route: '/changelog' },
  { query: 'explore', route: '/explore' },
]

describe('page tier is retrievable from global search', () => {
  it.each(QUERIES)('finds $route for "$query"', ({ query, route }) => {
    const hits = unified.searchPalette(query, PALETTE_OPTS)
    const hit = hits.find((h) => h.source === PAGE_SOURCE && h.deepLink === route)
    expect(
      hit,
      `"${query}" did not return the ${route} page. Top: ${hits
        .slice(0, 5)
        .map((h) => `${h.source}/${h.title}`)
        .join(' | ')}`
    ).toBeDefined()
  })

  it('the four previously-zero-chunk pages were genuinely absent before this shipped', () => {
    // Same measurement the work order recorded, re-run against the shipped
    // corpus so the claim cannot rot: no published chunk deep-links to them.
    const corpusPath = path.join(process.cwd(), 'public', 'data', 'rag-corpus.json')
    const data = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'))
    const corpus: RAGChunk[] = data.chunks ?? data
    for (const route of ['/revisions', '/editorial-independence', '/sponsor', '/simulation']) {
      const inCorpus = corpus.filter((c) => (c.deepLink ?? '').startsWith(route))
      expect(
        inCorpus.length,
        `${route} now has ${inCorpus.length} corpus chunks — the generator may cover it, ` +
          'so re-check whether the derived entry is still the only representation.'
      ).toBe(0)
    }
  })
})
