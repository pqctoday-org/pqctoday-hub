// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Retrieval-quality floor for the Command Palette (⌘K) search over the real published corpus
 * (public/data/rag-corpus.json): for each well-known question, the record that should answer it
 * is among the top 10 results. Each query is about finding the right source, and carries the
 * reason the expected record is the right one.
 *
 * If corpus growth pushes one out of the top 10, that is a ranking regression to look at, not a
 * number to relax quietly.
 */
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import { UnifiedSearchService } from '../UnifiedSearchService'

interface Golden {
  query: string
  /** A result counts when its id starts with this prefix... */
  idPrefix?: string
  /** ...or when it comes from this source. */
  source?: string
}

const GOLDEN: Golden[] = [
  // The country timeline entries
  { query: 'France PQC migration timeline', source: 'timeline' },
  { query: 'PQC timeline for Israel', source: 'timeline' },
  { query: 'Germany BSI PQC requirements', idPrefix: 'library-BSI-BSZ-METHOD' },
  // A named framework
  { query: 'CNSA 2.0 requirements', idPrefix: 'compliance-CNSA-2' },
  // A named standard
  { query: 'FIPS 203 standard', idPrefix: 'doc-enrichment-United States:NIST' },
  // A named reference document
  {
    query: 'Show FIPS 140-3 validated modules with PQC',
    idPrefix: 'library-NIST-CMVP-Validated-Modules',
  },
  { query: 'Define crypto agility', idPrefix: 'library-ANSSI-s-views-on-crypto-agility' },
  {
    query: 'Financial services quantum threats',
    idPrefix: 'library-Europol-FS-ISAC-PQC-Financial',
  },
  // A comparison and a page guide
  { query: 'Compare ML-DSA and SLH-DSA', idPrefix: 'module-summary-slh-dsa' },
  { query: 'What are the PQC leaders from Germany?', idPrefix: 'page-guide-leaders' },
]

let unified: UnifiedSearchService

beforeAll(() => {
  const corpusPath = process.env.RAG_CORPUS_TEST_PATH || path.resolve('public/data/rag-corpus.json')
  const raw = JSON.parse(fs.readFileSync(corpusPath, 'utf8')) as { chunks: RAGChunk[] }
  UnifiedSearchService.resetInstance()
  unified = UnifiedSearchService.getInstance()
  unified.initializeWithCorpus(raw.chunks)
}, 60_000)

afterAll(() => UnifiedSearchService.resetInstance())

describe('Command Palette retrieval quality on the real corpus', () => {
  it.each(GOLDEN)('"$query" finds its record in the top 10', ({ query, idPrefix, source }) => {
    const top = unified.searchPalette(query, { limit: 10 })
    expect(top.length).toBeGreaterThan(0)
    expect(
      top.some((r) => (idPrefix !== undefined && r.id.startsWith(idPrefix)) || r.source === source),
      `top 10 for "${query}": ${top.map((r) => r.id).join(', ')}`
    ).toBe(true)
  })
})
