// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS6a integration check — a real MiniSearch index built the way production
 * builds it (published corpus + registry-derived tool entries) actually
 * returns tools for the queries a user would type.
 *
 * The drift guard next door proves the entries exist and route correctly. This
 * proves they are *retrievable*, which is the acceptance criterion that
 * matters: "every browser tool resolves in global ⌘K by name, by keyword, and
 * by an algorithm it implements".
 */
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'

import { UnifiedSearchService } from './UnifiedSearchService'
import { toolSearchEntries } from './toolSearchEntries'
import type { RAGChunk } from '@/types/ChatTypes'

let unified: UnifiedSearchService

beforeAll(() => {
  const corpusPath = path.join(process.cwd(), 'public', 'data', 'rag-corpus.json')
  const data = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'))
  const corpus: RAGChunk[] = data.chunks ?? data

  UnifiedSearchService.resetInstance()
  unified = UnifiedSearchService.getInstance()
  // Mirrors the production `withToolEntries(...)` composition in load() /
  // loadCached() — corpus first, registry-derived tool entries appended.
  unified.initializeWithCorpus([...corpus, ...toolSearchEntries()])
})

/** Queries a real user would type, and the tool each must surface. */
const NAME_QUERIES: Array<{ query: string; toolId: string; source: string }> = [
  { query: 'ROI Calculator', toolId: 'roi-calculator', source: 'business-tool' },
  { query: 'Board Pitch Builder', toolId: 'board-pitch', source: 'business-tool' },
  { query: 'SLH-DSA Sign', toolId: 'slh-dsa', source: 'workshop-tool' },
  { query: 'TLS 1.3 Simulator', toolId: 'tls-simulator', source: 'workshop-tool' },
  { query: 'KMIP Control Plane', toolId: 'cacp-kmip', source: 'workshop-tool' },
]

describe('WS6a — tools are retrievable from global search', () => {
  it.each(NAME_QUERIES)('finds "$query" by name', ({ query, toolId, source }) => {
    const hits = unified.searchPalette(query, { limit: 25 })
    const hit = hits.find((h) => h.source === source && h.metadata?.toolId === toolId)
    expect(
      hit,
      `"${query}" did not return ${source}:${toolId}. Top: ${hits
        .slice(0, 5)
        .map((h) => `${h.source}/${h.title}`)
        .join(' | ')}`
    ).toBeDefined()
  })

  // Broad algorithm names are the hard case, and the reason `ensureSources`
  // exists. Measured before it was added: the first tool for "SLH-DSA" sat at
  // global rank 46 and for "ML-KEM" at rank 207, both outside the palette's
  // 60-result fetch — so tools were absent from their own group despite being
  // indexed. These assert the palette's real call shape, not a bare search.
  const PALETTE_OPTS = {
    limit: 60,
    ensureSources: ['workshop-tool', 'business-tool'],
    ensureLimit: 3,
  }

  it.each(['SLH-DSA', 'ML-KEM', 'ML-DSA', 'entropy', 'TPM', 'JWT'])(
    'surfaces a lab tool for the broad algorithm query "%s"',
    (query) => {
      const hits = unified.searchPalette(query, PALETTE_OPTS)
      const toolHits = hits.filter((h) => h.source === 'workshop-tool')
      expect(toolHits.length, `no Crypto Lab tool surfaced for "${query}"`).toBeGreaterThan(0)
    }
  )

  it('ensureSources is append-only — it never displaces a higher-ranked result', () => {
    // WS6 risk R2 in reverse: guaranteeing tools a slot must not evict
    // anything. The first 60 results must be identical with and without it.
    const withoutEnsure = unified.searchPalette('ML-KEM', { limit: 60 })
    const withEnsure = unified.searchPalette('ML-KEM', PALETTE_OPTS)
    expect(withEnsure.slice(0, withoutEnsure.length).map((h) => h.id)).toEqual(
      withoutEnsure.map((h) => h.id)
    )
    expect(withEnsure.length).toBeGreaterThan(withoutEnsure.length)
  })

  it('ensureSources adds nothing when the source already has a slot', () => {
    // "ROI" already returns the ROI Calculator at rank 1, so there is nothing
    // to guarantee and the result set must be unchanged.
    const plain = unified.searchPalette('ROI', { limit: 60 })
    const ensured = unified.searchPalette('ROI', PALETTE_OPTS)
    expect(ensured.map((h) => h.id)).toEqual(plain.map((h) => h.id))
  })

  it('routes tool results to their own route, not a guide page', () => {
    const hits = unified.searchPalette('ROI Calculator', { limit: 25 })
    const hit = hits.find((h) => h.source === 'business-tool')
    expect(hit?.deepLink).toBe('/business/tools/roi-calculator')
  })

  it('can filter the palette to tools only', () => {
    const hits = unified.searchPalette('key', {
      limit: 50,
      sources: ['workshop-tool', 'business-tool'],
    })
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.every((h) => h.source === 'workshop-tool' || h.source === 'business-tool')).toBe(
      true
    )
  })

  it('does not return container-only sandbox scenarios', () => {
    // Browser-only grading scope: sandbox ids are prefixed in the registry, so
    // any leak would show up as a workshop-tool hit whose id carries the prefix.
    const hits = unified.searchPalette('sandbox', { limit: 50 })
    const leaked = hits.filter(
      (h) => h.source === 'workshop-tool' && String(h.metadata?.toolId ?? '').startsWith('sbx-')
    )
    expect(leaked).toEqual([])
  })

  it('does not drown substantive results — a standards query still ranks non-tool sources first', () => {
    // WS6 risk R2: 71 short high-keyword-density entries could outrank library
    // and Learn content. A canonical standards query must still lead with them.
    const hits = unified.searchPalette('FIPS 203', { limit: 10 })
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].source).not.toBe('workshop-tool')
    expect(hits[0].source).not.toBe('business-tool')
  })
})
