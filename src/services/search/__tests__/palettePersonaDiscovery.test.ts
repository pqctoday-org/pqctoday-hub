// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Deterministic verification of the Command Palette (⌘K) search over the published corpus
 * plus the tool and page entries:
 * 1. Role-scoped discovery across all 8 personas (executive, grc, architect, developer, ops,
 *    researcher, cert-engineer, curious): every persona's own scenario returns ranked hits.
 * 2. Workshop step deep links (?tab=workshop&step=<N>).
 * 3. authoritativeOnly filtering reports the hidden non-authoritative hits.
 */
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import { UnifiedSearchService } from '@/services/search/UnifiedSearchService'
import { toolSearchEntries } from '@/services/search/toolSearchEntries'
import { pageSearchEntries } from '@/services/search/pageSearchEntries'

let unifiedSearch: UnifiedSearchService
let allChunks: RAGChunk[] = []

beforeAll(async () => {
  const corpusPath = process.env.RAG_CORPUS_TEST_PATH || path.resolve('public/data/rag-corpus.json')
  const raw = JSON.parse(fs.readFileSync(corpusPath, 'utf8')) as { chunks: RAGChunk[] }
  const extraPages = await pageSearchEntries()
  const extraTools = toolSearchEntries()
  allChunks = [...raw.chunks, ...extraTools, ...extraPages]

  UnifiedSearchService.resetInstance()

  unifiedSearch = UnifiedSearchService.getInstance()
  unifiedSearch.initializeWithCorpus(allChunks)
}, 30_000)

afterAll(() => {
  UnifiedSearchService.resetInstance()
})

describe('Role-scoped discovery in the Command Palette (UnifiedSearchService)', () => {
  const PERSONA_SCENARIOS: Array<{
    persona: string
    query: string
    expectedIdPrefixOrSource: string
    expectedRoutePrefix: string
  }> = [
    {
      persona: 'executive',
      query: 'ROI Calculator business decision exercise',
      expectedIdPrefixOrSource: 'business-center',
      expectedRoutePrefix: '/business',
    },
    {
      persona: 'grc',
      query: 'CNSA 2.0 compliance framework deadline 2030',
      expectedIdPrefixOrSource: 'compliance',
      expectedRoutePrefix: '/compliance',
    },
    {
      persona: 'architect',
      query: 'Hybrid Cryptography production tool capability checklist',
      expectedIdPrefixOrSource: 'capability-checklist',
      expectedRoutePrefix: '/learn/hybrid-crypto',
    },
    {
      persona: 'developer',
      query: 'Developer Quantum Impact workshop token size Authorization header line budget',
      expectedIdPrefixOrSource: 'module-summaries',
      expectedRoutePrefix: '/learn/dev-quantum-impact',
    },
    {
      persona: 'ops',
      query: 'Thales Luna HSM FIPS 140-3 migration catalog',
      expectedIdPrefixOrSource: 'migrate',
      expectedRoutePrefix: '/migrate',
    },
    {
      persona: 'researcher',
      query: 'ML-KEM-768 FIPS 203 lattice key encapsulation',
      expectedIdPrefixOrSource: 'algorithms',
      expectedRoutePrefix: '/algorithms',
    },
    {
      persona: 'cert-engineer',
      query: 'ACVP Lab Workflow production tool capability checklist',
      expectedIdPrefixOrSource: 'capability-checklist',
      expectedRoutePrefix: '/learn/acvp-lab-workflow',
    },
    {
      persona: 'curious',
      query: 'Harvest Now Decrypt Later HNDL definition',
      expectedIdPrefixOrSource: 'glossary',
      expectedRoutePrefix: '/',
    },
  ]

  it.each(PERSONA_SCENARIOS)(
    'resolves ranked palette hits for persona "$persona"',
    ({ query, expectedIdPrefixOrSource, expectedRoutePrefix }) => {
      const paletteResults = unifiedSearch.searchPalette(query, { limit: 10 })
      expect(paletteResults.length).toBeGreaterThan(0)
      expect(paletteResults[0].score).toBeGreaterThan(0)
      expect(
        paletteResults.some(
          (r) =>
            r.source === expectedIdPrefixOrSource ||
            r.id.startsWith(expectedIdPrefixOrSource) ||
            r.deepLink?.startsWith(expectedRoutePrefix)
        )
      ).toBe(true)
    }
  )

  it('finds workshop step deep links (?tab=workshop&step=<N>)', () => {
    const wsPaletteHits = unifiedSearch.searchPalette('Agent2AgentProtocol AI Security workshop', {
      limit: 10,
    })
    expect(wsPaletteHits.some((r) => r.deepLink?.includes('?tab=workshop&step='))).toBe(true)
  })

  it('enforces authoritativeOnly filtering and reports hidden non-authoritative hits in searchPaletteWithHidden', () => {
    const { results, hidden } = unifiedSearch.searchPaletteWithHidden('ML-KEM', {
      limit: 25,
      authoritativeOnly: true,
    })
    expect(results.length).toBeGreaterThan(0)
    expect(hidden.length).toBeGreaterThan(0)
    const shownIds = new Set(results.map((r) => r.id))
    expect(hidden.every((h) => !shownIds.has(h.id))).toBe(true)
  })
})
